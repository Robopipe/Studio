import { useCameraStream } from "@/modules/camera-stream";
import { useEffect, useRef } from "react";
import { NNDetections } from "../types/detections";

export interface UseDetectionsOptions {
  /**
   * @deprecated No longer used — detections come from the project-wide
   * camera selection slice. Kept to avoid breaking existing call sites.
   */
  selectedMxid: string;
  /** @deprecated See selectedMxid. */
  selectedSensorName: string;
  onDetections?: (detections: NNDetections) => void;
  enabled?: boolean;
}

export interface UseDetectionsReturn {
  detections: NNDetections;
  isConnected: boolean;
  error: string | null;
}

/**
 * Thin consumer of the shared detections WebSocket. Consumers that want to
 * react per-message (e.g. canvas renderers) pass `onDetections` and avoid
 * the extra render; consumers that just want the latest state read
 * `detections` directly.
 */
export const useDetections = ({
  onDetections,
  enabled = true,
}: UseDetectionsOptions): UseDetectionsReturn => {
  const {
    detections,
    isDetectionsConnected,
    detectionsError,
    subscribeDetections,
  } = useCameraStream();

  const onDetectionsRef = useRef(onDetections);
  onDetectionsRef.current = onDetections;

  useEffect(() => {
    if (!enabled || !onDetectionsRef.current) return;
    const unsubscribe = subscribeDetections((d) => {
      onDetectionsRef.current?.(d);
    });
    return unsubscribe;
  }, [enabled, subscribeDetections]);

  return {
    detections,
    isConnected: isDetectionsConnected,
    error: detectionsError,
  };
};
