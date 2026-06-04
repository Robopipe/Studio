import { useEffect } from "react";
import { CameraDisplay } from "../CameraDisplay";
import { ImageProfile } from "../ImageProfile";

export interface LiveCaptureProps {
  selectedCamera: string | null;
  selectedStream: string | null;
  isSwitchingStream?: boolean;
  onStreamingChange?: (isStreaming: boolean) => void;
  onMediaStreamChange?: (stream: MediaStream | null) => void;
  isRecording?: boolean;
}

export const LiveCapture = ({
  selectedCamera,
  selectedStream,
  isSwitchingStream,
  onStreamingChange,
  onMediaStreamChange,
  isRecording,
}: LiveCaptureProps) => {
  useEffect(() => {
    if (!selectedStream || isSwitchingStream) {
      onStreamingChange?.(false);
    }
  }, [selectedStream, isSwitchingStream, onStreamingChange]);

  const showConnecting =
    selectedCamera && (!selectedStream || isSwitchingStream);

  return (
    <div className="flex min-h-0 flex-col gap-4 overflow-y-auto p-6">
      <p className="text-xl font-bold">Capture images live</p>

      {showConnecting && (
        <div className="relative">
          <div className="aspect-video w-full rounded-md bg-black/5" />
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            Loading stream...
          </div>
        </div>
      )}

      {selectedCamera && selectedStream && !isSwitchingStream && (
        <>
          <CameraDisplay
            selectedMxid={selectedCamera}
            selectedSensorName={selectedStream}
            onStreamingChange={onStreamingChange}
            onMediaStreamChange={onMediaStreamChange}
            isRecording={isRecording}
          />
          <ImageProfile
            selectedCamera={selectedCamera}
            selectedStream={selectedStream}
          />
        </>
      )}
    </div>
  );
};
