import { useCameraStream } from "@/modules/camera-stream";
import { useGetModelQuery } from "@/modules/model/services";
import { RefObject, useCallback, useEffect, useRef } from "react";
import { NNDetections } from "../types/detections";
import {
  renderBBoxDetection,
  renderClassificationDetection,
  renderSegmentationMask,
} from "../utils/renderDetections";

export interface UseDetectionsRendererOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  projectId: number;
  modelId: number;
  enabled?: boolean;
}

export interface UseDetectionsRendererReturn {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  renderDetections: (detections: NNDetections) => void;
}

// Opt into the new seq-based pairing with `?syncMode=seq`. Default stays on
// the legacy 50 ms setTimeout path so this lands as a pure feature add — the
// switchover happens after we've validated parity in real conditions.
const useSeqSync = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("syncMode") === "seq";
  } catch {
    return false;
  }
};

// Browser support check for HTMLVideoElement.requestVideoFrameCallback. Falls
// back to the legacy renderer if missing (Firefox without the flag, older
// Safari). Cast keeps TS happy without polluting global types.
const hasRVFC = (video: HTMLVideoElement): boolean =>
  typeof (video as unknown as { requestVideoFrameCallback?: unknown })
    .requestVideoFrameCallback === "function";

interface RVFCMetadata {
  mediaTime: number;
  rtpTimestamp?: number;
  presentedFrames?: number;
}

type RVFCCallback = (now: number, metadata: RVFCMetadata) => void;

const requestVFC = (video: HTMLVideoElement, cb: RVFCCallback): number =>
  (
    video as unknown as {
      requestVideoFrameCallback: (cb: RVFCCallback) => number;
    }
  ).requestVideoFrameCallback(cb);

const cancelVFC = (video: HTMLVideoElement, handle: number): void => {
  const fn = (
    video as unknown as {
      cancelVideoFrameCallback?: (handle: number) => void;
    }
  ).cancelVideoFrameCallback;
  if (typeof fn === "function") fn.call(video, handle);
};

export const useDetectionsRenderer = ({
  videoRef,
  projectId,
  modelId,
  enabled = true,
}: UseDetectionsRendererOptions): UseDetectionsRendererReturn => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const { data } = useGetModelQuery(
    { projectId, modelId },
    { skip: !projectId || !modelId },
  );
  const { sync } = useCameraStream();
  const seqSync = useSeqSync();

  const getOffscreenCanvas = useCallback(
    (width: number, height: number): HTMLCanvasElement => {
      if (!offscreenRef.current) {
        offscreenRef.current = document.createElement("canvas");
      }
      const offscreen = offscreenRef.current;
      if (offscreen.width !== width || offscreen.height !== height) {
        offscreen.width = width;
        offscreen.height = height;
      }
      return offscreen;
    },
    [],
  );

  const drawToCanvas = useCallback(
    (detections: NNDetections) => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Double-buffer: draw to offscreen canvas first, then swap in one draw
      // call to avoid flickering.
      const offscreen = getOffscreenCanvas(canvas.width, canvas.height);
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) return;

      offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
      renderSegmentationMask(offCtx, data?.labels || [], detections);
      for (const detection of detections.detections) {
        if (detection.confidence < 0.5) continue;
        renderBBoxDetection(offCtx, data?.labels || [], detection);
        renderClassificationDetection(offCtx, data?.labels || [], detection);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(offscreen, 0, 0);
    },
    [data, getOffscreenCanvas],
  );

  // Legacy path: 50 ms setTimeout before drawing the latest detection.
  // Replaced by the rVFC loop below when ?syncMode=seq is set on a browser
  // that supports requestVideoFrameCallback.
  const renderDetections = useCallback(
    async (detections: NNDetections) => {
      if (!canvasRef.current || !videoRef.current || !enabled) return;
      if (seqSync && hasRVFC(videoRef.current)) {
        // In seq-sync mode the rVFC effect owns rendering; the WS push is a
        // no-op so detections aren't drawn twice (rVFC also yields tighter
        // alignment to the displayed frame).
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
      drawToCanvas(detections);
    },
    [drawToCanvas, enabled, seqSync, videoRef],
  );

  // Seq-sync rendering loop. On every painted video frame, map the frame's
  // RTP timestamp back to a server seq and draw the matching cached
  // detection. The browser sees rtp + a constant per-session RFC 3550 random
  // offset, which we anchor once on the first paint that has a usable
  // /video-meta entry to compare against.
  useEffect(() => {
    if (!seqSync || !enabled) return;
    const video = videoRef.current;
    if (!video) return;
    if (!hasRVFC(video)) return;

    let cancelled = false;
    let handle: number | null = null;
    let rtpOffset: number | null = null;

    const tick: RVFCCallback = (_now, metadata) => {
      if (cancelled) return;

      const browserRtp = metadata.rtpTimestamp;
      if (typeof browserRtp === "number") {
        if (rtpOffset == null) {
          // Anchor: assume the most recent /video-meta entry corresponds
          // approximately to the frame currently being painted. Skew is
          // bounded by the WebRTC jitter buffer (~1–2 frames at 30 FPS),
          // so worst-case overlay alignment is one frame off.
          const latest = sync.latestServerRtp();
          if (latest != null) {
            rtpOffset = browserRtp - latest;
          }
        }
        if (rtpOffset != null) {
          const serverRtp = browserRtp - rtpOffset;
          const frameSeq = sync.seqAtServerRtp(serverRtp);
          if (frameSeq != null) {
            const dets = sync.detectionsForSeq(frameSeq);
            if (dets) drawToCanvas(dets);
          }
        }
      }

      handle = requestVFC(video, tick);
    };

    handle = requestVFC(video, tick);

    return () => {
      cancelled = true;
      if (handle != null) cancelVFC(video, handle);
    };
  }, [seqSync, enabled, videoRef, sync, drawToCanvas]);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current || !enabled) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const syncCanvasSize = () => {
      const [elW, elH] = [video.clientWidth, video.clientHeight];
      const [mediaW, mediaH] = [video.videoWidth, video.videoHeight];
      const mediaAR = mediaW / mediaH;
      const elAR = elW / elH;
      let renderW, renderH;

      if (mediaAR > elAR) {
        renderW = elW;
        renderH = elW / mediaAR;
      } else {
        renderH = elH;
        renderW = elH * mediaAR;
      }
      canvas.width = renderW;
      canvas.height = renderH;
    };
    syncCanvasSize();
    window.addEventListener("resize", syncCanvasSize);
    video.addEventListener("loadedmetadata", syncCanvasSize);

    return () => {
      window.removeEventListener("resize", syncCanvasSize);
      video.removeEventListener("loadedmetadata", syncCanvasSize);
    };
  }, [videoRef.current, canvasRef.current, enabled]);

  return { canvasRef, renderDetections };
};
