import { useWebRTCStream } from "../../hooks/useWebRTCStream";

interface CameraDisplayProps {
  selectedMxid: string;
  selectedSensorName: string;
}

export const CameraDisplay = ({
  selectedMxid,
  selectedSensorName,
}: CameraDisplayProps) => {
  const { videoRef, isStreaming, error } = useWebRTCStream({
    selectedMxid,
    selectedSensorName,
  });

  return (
    <div className="relative">
      {isStreaming && (
        <span className="absolute left-4 top-4 z-10 bg-red-700 px-2.5 py-1.5 rounded-sm text-base font-bold uppercase leading-tight tracking-[0.125rem] text-white">
          LIVE
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
