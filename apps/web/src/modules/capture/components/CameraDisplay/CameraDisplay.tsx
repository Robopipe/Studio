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
        <span className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-md bg-red-500 px-2 py-1 text-[11px] font-bold uppercase leading-none tracking-[0.08em] text-white shadow-sm">
          <span className="size-1.5 rounded-full bg-white" />
          LIVE
        </span>
      )}

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="aspect-video w-full rounded-2xl bg-black/5"
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
