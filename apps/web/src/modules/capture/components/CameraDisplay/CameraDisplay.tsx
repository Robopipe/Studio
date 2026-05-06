import { pickDisplayCropRows } from "@/modules/camera-stream/utils/decodeTimestampBurnin";
import { useCallback, useEffect, useState } from "react";
import { useWebRTCStream } from "../../hooks/useWebRTCStream";

interface CameraDisplayProps {
  selectedMxid: string;
  selectedSensorName: string;
  onStreamingChange?: (isStreaming: boolean) => void;
  onMediaStreamChange?: (stream: MediaStream | null) => void;
  isRecording?: boolean;
}

export const CameraDisplay = ({
  selectedMxid,
  selectedSensorName,
  onStreamingChange,
  onMediaStreamChange,
  isRecording,
}: CameraDisplayProps) => {
  const { videoRef, isStreaming, error } = useWebRTCStream({
    selectedMxid,
    selectedSensorName,
    onMediaStreamChange,
  });

  const [aspectRatio, setAspectRatio] = useState("16/9");
  const [sourceSize, setSourceSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video && video.videoWidth && video.videoHeight) {
      setAspectRatio(`${video.videoWidth}/${video.videoHeight}`);
      setSourceSize({ width: video.videoWidth, height: video.videoHeight });
    }
  }, [videoRef]);

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

      {isRecording && (
        <span className="absolute right-4 top-4 z-10 flex items-center gap-1.5 bg-red-600 px-2.5 py-1.5 rounded-md text-xs font-bold uppercase text-white">
          <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
          REC
        </span>
      )}

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onLoadedMetadata={handleLoadedMetadata}
        style={{
          aspectRatio,
          ...(sourceSize && {
            clipPath: `inset(${(pickDisplayCropRows(sourceSize.width) / sourceSize.height) * 100}% 0 0 0)`,
          }),
        }}
        className="w-full rounded-md bg-black/5"
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
