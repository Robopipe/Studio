import { Button } from "@/modules/shadcn/ui/button";
import { Video } from "lucide-react";
import { useVideoCapture } from "../../context/VideoCaptureContext";

export interface CaptureVideoProps {
  mediaStream: MediaStream | null;
  isStreaming: boolean;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export const CaptureVideo = ({ mediaStream, isStreaming }: CaptureVideoProps) => {
  const {
    isRecording,
    recordingDurationMs,
    isSupported,
    isSaving,
    startRecording,
    stopAndSaveRecording,
  } = useVideoCapture();

  if (!isSupported) return null;

  return (
    <div className="flex flex-col gap-2">
      {isRecording ? (
        <>
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-red-600">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" />
            {formatDuration(recordingDurationMs)}
          </div>
          <Button
            onClick={() => {
              // Fire and forget — the redux pending-upload slice keeps the
              // user informed; errors are toasted from the provider layer.
              void stopAndSaveRecording().catch((e) =>
                console.error("Failed to save recording", e),
              );
            }}
            disabled={isSaving}
            variant="destructive"
            size="lg"
          >
            Stop recording
          </Button>
        </>
      ) : (
        <Button
          onClick={startRecording}
          disabled={!isStreaming || !mediaStream}
          variant="outline"
          size="lg"
        >
          <Video className="size-4" />
          Record video
        </Button>
      )}
    </div>
  );
};
