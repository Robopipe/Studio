import { useGetNNQuery } from "@/core/cameraApi";
import { useCameraApiUrl } from "@/hooks";
import { useAppSelector } from "@/hooks/redux";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import type { NNDetections } from "@/modules/run/types/detections";
import type { RootState } from "@/store/types";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
  CameraStreamContext,
  CameraStreamContextValue,
} from "../context/cameraStreamContext";
import {
  decodeTimestampBurnin,
  stripDimensions,
} from "../utils/decodeTimestampBurnin";
import { FrameMatcher, type SyncedFrame } from "../utils/frameMatcher";

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
  const syncedSubscribersRef = useRef<Set<(s: SyncedFrame) => void>>(new Set());
  const matcherRef = useRef<FrameMatcher | null>(null);

  const subscribeDetections = useCallback(
    (cb: (d: NNDetections) => void) => {
      subscribersRef.current.add(cb);
      return () => {
        subscribersRef.current.delete(cb);
      };
    },
    [],
  );

  const subscribeSyncedFrames = useCallback(
    (cb: (s: SyncedFrame) => void) => {
      syncedSubscribersRef.current.add(cb);
      return () => {
        syncedSubscribersRef.current.delete(cb);
      };
    },
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

  // Matcher lifecycle. Resets whenever NN deploy state or pipeline topology
  // changes, since pending frame/detection ts values from a previous
  // session aren't meaningful anymore. The matcher's emit is fanned out to
  // syncedSubscribersRef so subscribers survive matcher rebuilds.
  useEffect(() => {
    if (!hasNN) return;

    const matcher = new FrameMatcher();
    matcher.onMatch((synced) => {
      if (syncedSubscribersRef.current.size === 0) {
        // No live subscriber: matcher's emit transferred ownership to us
        // and there's nobody to hand it off to — close to avoid leaks.
        synced.bitmap.close();
        return;
      }
      for (const cb of syncedSubscribersRef.current) {
        try {
          cb(synced);
        } catch (e) {
          console.error("Synced frame subscriber threw:", e);
        }
      }
    });
    matcherRef.current = matcher;

    return () => {
      matcherRef.current = null;
      matcher.dispose();
    };
  }, [hasNN, mxid, streamName, pipelineGeneration]);

  // Frame capture loop — drives the matcher's frame side. Only runs when
  // both a media stream and NN are present; otherwise there's nothing to
  // sync.
  useEffect(() => {
    if (!mediaStream || !hasNN) return;

    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.srcObject = mediaStream;
    void video.play().catch(() => {});

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let cancelled = false;
    let rvfcId: number | undefined;

    const onFrame: VideoFrameRequestCallback = () => {
      if (cancelled) return;
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (w === 0 || h === 0) {
        rvfcId = video.requestVideoFrameCallback(onFrame);
        return;
      }

      const { stripWidth, stripHeight } = stripDimensions(w);
      if (stripWidth > w || stripHeight > h) {
        rvfcId = video.requestVideoFrameCallback(onFrame);
        return;
      }

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      ctx.drawImage(video, 0, 0);
      const stripData = ctx.getImageData(0, 0, stripWidth, stripHeight);
      const ts = decodeTimestampBurnin(stripData, w);
      const capturedAt = performance.now();

      // Snapshot the canvas before re-arming so the bitmap captures THIS
      // frame even if the next callback overwrites the canvas before our
      // promise resolves.
      const bitmapPromise =
        ts !== null && matcherRef.current
          ? createImageBitmap(canvas)
          : null;

      rvfcId = video.requestVideoFrameCallback(onFrame);

      if (bitmapPromise) {
        bitmapPromise.then(
          (bitmap) => {
            if (cancelled || !matcherRef.current) {
              bitmap.close();
              return;
            }
            matcherRef.current.pushFrame(ts!, bitmap, capturedAt);
          },
          (err) => {
            console.error("createImageBitmap failed:", err);
          },
        );
      }
    };

    rvfcId = video.requestVideoFrameCallback(onFrame);

    return () => {
      cancelled = true;
      if (rvfcId !== undefined) {
        video.cancelVideoFrameCallback(rvfcId);
      }
      video.srcObject = null;
      video.pause();
    };
  }, [mediaStream, hasNN]);

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

        ws.onmessage = async (event) => {
          if (cancelled) return;
          try {
            const data = JSON.parse(event.data);
            const parsed: NNDetections = Array.isArray(data)
              ? { detections: data }
              : data;
            // Decode the compact PNG mask (if present) into an ImageBitmap
            // before publishing, so the synchronous renderer can drawImage
            // without blocking on async decode each paint. Single-channel
            // uint8 PNG where pixel value 0 means background and N means
            // detections[N - 1].
            if (parsed.masks_png) {
              try {
                const raw = atob(parsed.masks_png);
                const buf = new Uint8Array(raw.length);
                for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
                const blob = new Blob([buf], { type: "image/png" });
                parsed.maskBitmap = await createImageBitmap(blob);
              } catch {
                // Decode failures fall through to the legacy masks array
                // path on the renderer side, if the server sent one.
              }
              if (cancelled) {
                parsed.maskBitmap?.close?.();
                return;
              }
            }
            setDetections((prev) => {
              prev.maskBitmap?.close?.();
              return parsed;
            });
            subscribersRef.current.forEach((cb) => cb(parsed));
            // Push to matcher for synced rendering. Clone the maskBitmap
            // so the matcher owns its own copy independent of the legacy
            // setDetections cleanup; otherwise either side closing it
            // crashes the other.
            if (parsed.ts_us !== undefined && matcherRef.current) {
              const ts32 = parsed.ts_us % 0x100000000;
              let detectionsForMatcher: NNDetections = parsed;
              if (parsed.maskBitmap) {
                try {
                  const clonedMask = await createImageBitmap(parsed.maskBitmap);
                  detectionsForMatcher = { ...parsed, maskBitmap: clonedMask };
                } catch {
                  // If cloning fails, fall through with no mask in the
                  // matcher's copy rather than risking a double-close.
                  const { maskBitmap: _drop, ...rest } = parsed;
                  detectionsForMatcher = rest as NNDetections;
                }
              }
              matcherRef.current.pushDetections(
                ts32,
                detectionsForMatcher,
                performance.now(),
              );
            }
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

  const value: CameraStreamContextValue = {
    mediaStream,
    isStreaming,
    streamError,
    detections,
    isDetectionsConnected,
    detectionsError,
    subscribeDetections,
    subscribeSyncedFrames,
  };

  return (
    <CameraStreamContext.Provider value={value}>
      {children}
    </CameraStreamContext.Provider>
  );
};
