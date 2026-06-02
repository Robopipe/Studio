import { useCameraStream } from "@/modules/camera-stream";
import { useEffect, useRef } from "react";

export interface UseWebRTCStreamOptions {
  /**
   * @deprecated No longer used — the stream is driven by the project-wide
   * camera selection slice. Kept to avoid breaking existing call sites;
   * wrong values here now have no effect.
   */
  selectedMxid: string;
  /** @deprecated See selectedMxid. */
  selectedSensorName: string;
  onMediaStreamChange?: (stream: MediaStream | null) => void;
}

export interface UseWebRTCStreamReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isStreaming: boolean;
  error: string | null;
  replayEnded: boolean;
}

/**
 * Thin consumer of the shared CameraStreamProvider. Multiple components can
 * call this simultaneously — they share the same underlying MediaStream and
 * peer connection, keyed on the project's camera selection slice.
 *
 * Signature is preserved from the previous per-component implementation so
 * existing consumers (CameraDisplay, LiveInference) don't need changes.
 */
export const useWebRTCStream = (
  options: UseWebRTCStreamOptions,
): UseWebRTCStreamReturn => {
  const { onMediaStreamChange } = options;
  const { mediaStream, isStreaming, streamError, replayEnded } = useCameraStream();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Attach the shared MediaStream to this consumer's own <video>. Multiple
  // <video> elements can display the same MediaStream — assigning to
  // srcObject on each is fine (standard pattern).
  useEffect(() => {
    if (videoRef.current) {
      if (videoRef.current.srcObject !== mediaStream) {
        videoRef.current.srcObject = mediaStream;
      }
    }
  }, [mediaStream]);

  useEffect(() => {
    onMediaStreamChange?.(mediaStream);
  }, [mediaStream, onMediaStreamChange]);

  return {
    videoRef,
    isStreaming,
    error: streamError,
    replayEnded,
  };
};
