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
 *  - a (rtp, seq) ring buffer fed by the /video-meta WS, where rtp is the
 *    server's raw 90 kHz pts. The browser sees rtp + a constant per-session
 *    RFC 3550 random offset on its rtpTimestamp; the renderer anchors that
 *    offset on first paint.
 *  - a (seq -> NNDetections) ring buffer fed by the /nn WS.
 * Returns null when the requested entry is unknown (pipeline restart, no
 * data yet, browser without requestVideoFrameCallback, etc.) so callers
 * fall back to the legacy "latest detection" path.
 */
export interface CameraStreamSyncApi {
  /** Closest seq whose rtp <= the given (offset-corrected) server rtp. */
  seqAtServerRtp: (serverRtp: number) => number | null;
  /** The most recently published server rtp value, for offset anchoring. */
  latestServerRtp: () => number | null;
  /** Detections cached for an exact seq, with nearest-below fallback. */
  detectionsForSeq: (seq: number) => NNDetections | null;
  /** True once at least one (seq, rtp) pair has arrived from /video-meta. */
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
