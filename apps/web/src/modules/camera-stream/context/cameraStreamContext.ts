import type { NNDetections } from "@/modules/run/types/detections";
import { createContext } from "react";

export interface CameraStreamSnapshot {
  mediaStream: MediaStream | null;
  isStreaming: boolean;
  streamError: string | null;
  detections: NNDetections;
  isDetectionsConnected: boolean;
  detectionsError: string | null;
}

/**
 * Lookup helpers for seq-based sync. Backed by:
 *  - a (mediaTime, seq) ring buffer fed by the /video-meta WS, and
 *  - a (seq -> NNDetections) ring buffer fed by the /nn WS.
 * Returns null when the requested entry is unknown (pipeline restart, no
 * data yet, browser without requestVideoFrameCallback, etc.) so callers
 * fall back to the legacy "latest detection" path.
 */
export interface CameraStreamSyncApi {
  /** Largest known seq with t <= mediaTime. */
  seqAtMediaTime: (mediaTime: number) => number | null;
  /** Detections cached for an exact seq. */
  detectionsForSeq: (seq: number) => NNDetections | null;
  /** True once at least one (seq, t) pair has arrived from /video-meta. */
  isReady: () => boolean;
}

export interface CameraStreamContextValue extends CameraStreamSnapshot {
  /**
   * Register a callback invoked on every detections WS message. Returns an
   * unsubscribe function. Avoids forcing callback-only consumers (renderers)
   * to re-render on every message.
   */
  subscribeDetections: (cb: (detections: NNDetections) => void) => () => void;
  sync: CameraStreamSyncApi;
}

export const CameraStreamContext = createContext<CameraStreamContextValue | null>(
  null,
);
