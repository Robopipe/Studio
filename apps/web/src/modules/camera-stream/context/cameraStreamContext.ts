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

export interface CameraStreamContextValue extends CameraStreamSnapshot {
  /**
   * Register a callback invoked on every detections WS message. Returns an
   * unsubscribe function. Avoids forcing callback-only consumers (renderers)
   * to re-render on every message.
   */
  subscribeDetections: (cb: (detections: NNDetections) => void) => () => void;
}

export const CameraStreamContext = createContext<CameraStreamContextValue | null>(
  null,
);
