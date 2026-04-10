import { useEffect } from "react";
import { useWebRTCStream } from "../../hooks/useWebRTCStream";

interface CameraDisplayProps {
  selectedMxid: string;
  selectedSensorName: string;
  onStreamingChange?: (isStreaming: boolean) => void;
}

export const CameraDisplay = ({
  selectedMxid,
  selectedSensorName,
  onStreamingChange,
}: CameraDisplayProps) => {
  const { videoRef, isStreaming, error } = useWebRTCStream({
    selectedMxid,
    selectedSensorName,
  });

  useEffect(() => {
    onStreamingChange?.(isStreaming);
  }, [isStreaming, onStreamingChange]);

  return (
    <div className="relative">
      {isStreaming && (
        <span className="absolute left-4 top-4 z-10 bg-red-50 px-2.5 py-1.5 rounded-md text-xs font-bold uppercase text-red-700">
          Live
        </span>
      )}

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="aspect-video w-full rounded-md bg-black/5"
      ></video>

      {!isStreaming && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          Connecting to camera...
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-destructive">
          Error: {error}
        </div>
      )}
    </div>
  );
};
