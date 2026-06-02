import type { NNDetections } from "@/modules/run/types/detections";
import { createContext } from "react";
import type { SyncedFrame } from "../utils/frameMatcher";

export interface CameraStreamSnapshot {
  mediaStream: MediaStream | null;
  isStreaming: boolean;
  streamError: string | null;
  replayEnded: boolean;
  isReplay: boolean;
  detections: NNDetections;
  isDetectionsConnected: boolean;
  detectionsError: string | null;
}

export interface CameraStreamContextValue extends CameraStreamSnapshot {
  /**
   * Register a callback invoked on every detections WS message. Returns an
   * unsubscribe function. Avoids forcing callback-only consumers (renderers)
   * to re-render on every message.
   */
  subscribeDetections: (cb: (detections: NNDetections) => void) => () => void;
  /**
   * Register a callback invoked when a video frame and its matching
   * inference detections have both arrived. Subscriber takes ownership of
   * `synced.bitmap` and `synced.detections.maskBitmap` and must close them
   * after rendering. Active only when an NN is deployed on the stream.
   */
  subscribeSyncedFrames: (cb: (synced: SyncedFrame) => void) => () => void;
}

export const CameraStreamContext = createContext<CameraStreamContextValue | null>(
  null,
);
