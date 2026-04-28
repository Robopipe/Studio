import { useGetNNQuery } from "@/core/cameraApi";
import { useCameraApiUrl } from "@/hooks";
import { useAppSelector } from "@/hooks/redux";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import type { NNDetections } from "@/modules/run/types/detections";
import type { RootState } from "@/store/types";
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CameraStreamContext,
  CameraStreamContextValue,
  CameraStreamSyncApi,
} from "../context/cameraStreamContext";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: ["stun:stun.l.google.com:19302"] },
  ...(import.meta.env.VITE_TURN_SERVER_URL
    ? [
        {
          urls: [import.meta.env.VITE_TURN_SERVER_URL],
          username: import.meta.env.VITE_TURN_SERVER_USERNAME ?? "",
          credential: import.meta.env.VITE_TURN_SERVER_CREDENTIAL ?? "",
        },
      ]
    : []),
];

const ICE_GATHERING_TIMEOUT_MS = 5000;
const DETECTIONS_RECONNECT_DELAY_MS = 3000;
const DETECTIONS_MAX_RECONNECT_ATTEMPTS = 10;
const VIDEO_META_RECONNECT_DELAY_MS = 3000;
const VIDEO_META_MAX_RECONNECT_ATTEMPTS = 10;
// Ring buffer caps. 256 entries × 30 FPS ≈ 8.5 s of slack — well past the
// arrival jitter window between WebRTC video frames and the detection WS.
const SEQ_BUFFER_MAX = 256;
const DETECTIONS_BUFFER_MAX = 256;

export interface CameraStreamProviderProps {
  children: ReactNode;
}

/**
 * Owns a single WebRTC peer connection + a single detections WebSocket per
 * active project, keyed on the camera selection slice's (mxid, streamName)
 * tuple. Navigating between Capture and Run for the same camera no longer
 * rebuilds these — components just attach to the shared streams via the
 * context (see useWebRTCStream / useDetections, which are now thin shims).
 *
 * Mount this once inside the authenticated layout. The provider skips setup
 * until a project is active and a camera/stream is selected.
 */
export const CameraStreamProvider = ({ children }: CameraStreamProviderProps) => {
  const [activeProject] = useActiveProject();
  const { url: apiHost } = useCameraApiUrl();
  const projectId = activeProject?.id;

  const selection = useAppSelector((state: RootState) =>
    projectId != null ? state.cameraSelection.byProject[projectId] : undefined,
  );
  const mxid = selection?.cameraMxid ?? null;
  const streamName = selection?.streamName ?? null;

  // Bumped whenever the server restarts its pipeline for this stream
  // (deploy/stop NN, add/remove replay video, etc.) — see
  // cameraPipelineGenerationSlice. Used in the WebRTC useEffect deps so the
  // peer connection is rebuilt against the current pipeline, not the one it
  // was originally negotiated against.
  const pipelineGeneration = useAppSelector((state: RootState) =>
    mxid && streamName
      ? (state.cameraPipelineGeneration.byStream[`${mxid}-${streamName}`] ?? 0)
      : 0,
  );

  // Only run detections when an NN is actually deployed on this stream —
  // mirrors the behavior of the old useDetections hook (it gated on nnInfo).
  const { data: nnInfo } = useGetNNQuery(
    { mxid: mxid!, streamName: streamName! },
    { skip: !mxid || !streamName },
  );
  const hasNN = !!nnInfo;

  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  const [detections, setDetections] = useState<NNDetections>({ detections: [] });
  const [isDetectionsConnected, setIsDetectionsConnected] = useState(false);
  const [detectionsError, setDetectionsError] = useState<string | null>(null);

  const subscribersRef = useRef<Set<(d: NNDetections) => void>>(new Set());

  const subscribeDetections = useCallback(
    (cb: (d: NNDetections) => void) => {
      subscribersRef.current.add(cb);
      return () => {
        subscribersRef.current.delete(cb);
      };
    },
    [],
  );

  // Sorted-by-t ring buffer of (seq, mediaTime) pairs from the /video-meta WS,
  // and a parallel seq -> NNDetections cache from the /nn WS. Lookups happen
  // at video-frame paint time via requestVideoFrameCallback.
  const seqBufferRef = useRef<{ t: number; seq: number }[]>([]);
  const detectionsBySeqRef = useRef<Map<number, NNDetections>>(new Map());
  const detectionsSeqOrderRef = useRef<number[]>([]);
  const lastSeqRef = useRef<number>(-1);
  const seqReadyRef = useRef<boolean>(false);

  const resetSyncBuffers = useCallback(() => {
    seqBufferRef.current = [];
    detectionsBySeqRef.current.clear();
    detectionsSeqOrderRef.current = [];
    lastSeqRef.current = -1;
    seqReadyRef.current = false;
  }, []);

  const sync = useMemo<CameraStreamSyncApi>(
    () => ({
      seqAtMediaTime: (mediaTime: number) => {
        const buf = seqBufferRef.current;
        if (buf.length === 0) return null;
        // Binary search for the largest entry with t <= mediaTime.
        let lo = 0;
        let hi = buf.length - 1;
        let best = -1;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          if (buf[mid].t <= mediaTime) {
            best = mid;
            lo = mid + 1;
          } else {
            hi = mid - 1;
          }
        }
        return best >= 0 ? buf[best].seq : buf[0].seq;
      },
      detectionsForSeq: (seq: number) => {
        const cache = detectionsBySeqRef.current;
        const exact = cache.get(seq);
        if (exact) return exact;
        // Fall back to the largest seq <= requested. The detection seq lags
        // the video seq by at most one inference, so this picks the most
        // recent inference that applies to or precedes the displayed frame.
        const order = detectionsSeqOrderRef.current;
        if (order.length === 0) return null;
        let lo = 0;
        let hi = order.length - 1;
        let best = -1;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          if (order[mid] <= seq) {
            best = mid;
            lo = mid + 1;
          } else {
            hi = mid - 1;
          }
        }
        if (best < 0) return null;
        return cache.get(order[best]) ?? null;
      },
      isReady: () => seqReadyRef.current,
    }),
    [],
  );

  // WebRTC — one peer connection per (mxid, streamName, apiHost) tuple.
  useEffect(() => {
    if (!mxid || !streamName || !apiHost) {
      setMediaStream(null);
      setIsStreaming(false);
      setStreamError(null);
      return;
    }

    let cancelled = false;
    let peer: RTCPeerConnection | null = null;

    const init = async () => {
      try {
        setStreamError(null);
        const pc = new RTCPeerConnection({
          iceServers: ICE_SERVERS,
          iceTransportPolicy: "all",
        });
        peer = pc;
        pc.addTransceiver("video", { direction: "recvonly" });

        pc.addEventListener("track", (event) => {
          if (cancelled) return;
          const incoming = event.streams[0] ?? null;
          setMediaStream(incoming);
          setIsStreaming(true);
        });

        const iceCandidates: RTCIceCandidate[] = [];
        pc.addEventListener("icecandidate", (event) => {
          if (event.candidate) iceCandidates.push(event.candidate);
        });

        pc.addEventListener("connectionstatechange", () => {
          if (cancelled) return;
          if (
            pc.connectionState === "failed" ||
            pc.connectionState === "disconnected"
          ) {
            setIsStreaming(false);
            setStreamError("Connection lost");
          } else if (pc.connectionState === "connected") {
            setIsStreaming(true);
          }
        });

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        await new Promise<void>((resolve) => {
          const timeout = setTimeout(resolve, ICE_GATHERING_TIMEOUT_MS);
          const check = () => {
            if (pc.iceGatheringState === "complete") {
              clearTimeout(timeout);
              resolve();
            } else {
              setTimeout(check, 100);
            }
          };
          check();
        });

        if (cancelled) return;

        const offerUrl = `${apiHost}/cameras/${mxid}/streams/${streamName}/video`;
        const response = await fetch(offerUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sdp: offer.sdp,
            type: offer.type,
            candidates: iceCandidates.map((c) => ({
              candidate: c.candidate,
              sdpMLineIndex: c.sdpMLineIndex,
              sdpMid: c.sdpMid,
            })),
          }),
        });
        if (!response.ok) {
          throw new Error(
            `Failed to get answer from server: ${response.statusText}`,
          );
        }
        const answerData = await response.json();
        if (cancelled) return;
        await pc.setRemoteDescription(new RTCSessionDescription(answerData));

        if (Array.isArray(answerData.candidates)) {
          for (const candidate of answerData.candidates) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.warn("Failed to add ICE candidate:", err);
            }
          }
        }
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Unknown error";
        setStreamError(message);
        setIsStreaming(false);
        console.error("WebRTC error:", err);
      }
    };

    init();

    return () => {
      cancelled = true;
      if (peer) {
        peer.close();
      }
      setMediaStream(null);
      setIsStreaming(false);
    };
  }, [mxid, streamName, apiHost, pipelineGeneration]);

  // Detections WebSocket — only when an NN is deployed on this stream.
  useEffect(() => {
    if (!mxid || !streamName || !apiHost || !hasNN) {
      setDetections({ detections: [] });
      setIsDetectionsConnected(false);
      setDetectionsError(null);
      return;
    }

    let cancelled = false;
    let ws: WebSocket | null = null;
    let reconnectAttempts = 0;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (cancelled) return;
      const wsUrl = apiHost
        .replace(/^https:\/\//, "wss://")
        .replace(/^http:\/\//, "ws://");
      const endpoint = `${wsUrl}/cameras/${mxid}/streams/${streamName}/nn`;

      try {
        ws = new WebSocket(endpoint);

        ws.onopen = () => {
          if (cancelled) return;
          setIsDetectionsConnected(true);
          setDetectionsError(null);
          reconnectAttempts = 0;
        };

        ws.onmessage = (event) => {
          if (cancelled) return;
          try {
            const data = JSON.parse(event.data);
            const parsed: NNDetections = Array.isArray(data)
              ? { detections: data }
              : data;
            // Populate the seq -> detections cache so the renderer can pair
            // by seq at paint time. seq may be absent on legacy backends or
            // replay-from-file scenarios — those simply skip the cache and
            // fall through to the legacy "latest detection" path.
            if (typeof parsed.seq === "number") {
              const cache = detectionsBySeqRef.current;
              const order = detectionsSeqOrderRef.current;
              cache.set(parsed.seq, parsed);
              order.push(parsed.seq);
              if (order.length > DETECTIONS_BUFFER_MAX) {
                const evicted = order.shift();
                if (evicted !== undefined) cache.delete(evicted);
              }
            }
            setDetections(parsed);
            subscribersRef.current.forEach((cb) => cb(parsed));
          } catch {
            // ignore malformed messages
          }
        };

        ws.onerror = () => {
          if (cancelled) return;
          setDetectionsError("WebSocket connection error");
        };

        ws.onclose = () => {
          if (cancelled) return;
          setIsDetectionsConnected(false);
          ws = null;
          if (reconnectAttempts < DETECTIONS_MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts += 1;
            reconnectTimeout = setTimeout(
              connect,
              DETECTIONS_RECONNECT_DELAY_MS,
            );
          } else {
            setDetectionsError("Connection lost. Max reconnect attempts reached.");
          }
        };
      } catch (err) {
        setDetectionsError(
          err instanceof Error ? err.message : "Failed to connect to NN stream",
        );
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws) {
        ws.close();
      }
      setDetections({ detections: [] });
      setIsDetectionsConnected(false);
    };
  }, [mxid, streamName, apiHost, hasNN]);

  // Video-meta WebSocket — feeds the (seq, mediaTime) ring buffer used for
  // paint-time pairing. Independent of the detections WS so each channel
  // stays decoupled from the other (no cross-blocking).
  useEffect(() => {
    if (!mxid || !streamName || !apiHost) {
      resetSyncBuffers();
      return;
    }

    let cancelled = false;
    let ws: WebSocket | null = null;
    let reconnectAttempts = 0;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (cancelled) return;
      const wsUrl = apiHost
        .replace(/^https:\/\//, "wss://")
        .replace(/^http:\/\//, "ws://");
      const endpoint = `${wsUrl}/cameras/${mxid}/streams/${streamName}/video-meta`;

      try {
        ws = new WebSocket(endpoint);

        ws.onopen = () => {
          if (cancelled) return;
          reconnectAttempts = 0;
        };

        ws.onmessage = (event) => {
          if (cancelled) return;
          try {
            const data = JSON.parse(event.data);
            if (
              typeof data?.seq !== "number" ||
              typeof data?.t !== "number"
            ) {
              return;
            }
            const buf = seqBufferRef.current;
            // Pipeline restart resets seq to 0; drop the stale buffer so we
            // don't pair new video frames against old detections.
            if (data.seq + 1000 < lastSeqRef.current) {
              buf.length = 0;
              detectionsBySeqRef.current.clear();
              detectionsSeqOrderRef.current = [];
            }
            lastSeqRef.current = data.seq;
            buf.push({ t: data.t, seq: data.seq });
            if (buf.length > SEQ_BUFFER_MAX) {
              buf.splice(0, buf.length - SEQ_BUFFER_MAX);
            }
            seqReadyRef.current = true;
          } catch {
            // ignore malformed messages
          }
        };

        ws.onerror = () => {
          // Mirror detections WS: don't surface the error to the UI here
          // (it's a sync-mode-only channel; the legacy renderer keeps working
          // without it).
        };

        ws.onclose = () => {
          if (cancelled) return;
          ws = null;
          if (reconnectAttempts < VIDEO_META_MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts += 1;
            reconnectTimeout = setTimeout(
              connect,
              VIDEO_META_RECONNECT_DELAY_MS,
            );
          }
        };
      } catch {
        // Failed to construct the WS — silently bail; legacy path still works.
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws) {
        ws.close();
      }
      resetSyncBuffers();
    };
  }, [mxid, streamName, apiHost, pipelineGeneration, resetSyncBuffers]);

  const value: CameraStreamContextValue = {
    mediaStream,
    isStreaming,
    streamError,
    detections,
    isDetectionsConnected,
    detectionsError,
    subscribeDetections,
    sync,
  };

  return (
    <CameraStreamContext.Provider value={value}>
      {children}
    </CameraStreamContext.Provider>
  );
};
