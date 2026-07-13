import { useCallback, useState } from "react";
import { useVideoCapture } from "../../context/VideoCaptureContext";
import { CaptureStillImage } from "../CaptureStillImage";
import { CaptureVideo } from "../CaptureVideo";
import { RestartCameraButton } from "../RestartCameraButton/RestartCameraButton";
import { SelectCamera } from "../SelectCamera";
import { SelectStream } from "../SelectStream";
import { StopCaptureDialog } from "../StopCaptureDialog";

export interface CaptureSettingsProps {
  selectedCamera: string | null;
  selectedStream: string | null;
  isStreaming: boolean;
  isIntervalCapturing: boolean;
  onIntervalCapturingChange: (value: boolean) => void;
  onSelectCamera: (camera: string | null) => void;
  onSelectStream: (stream: string | null) => void;
  onStreamSwitchingChange?: (isSwitching: boolean) => void;
  mediaStream: MediaStream | null;
}

export const CaptureSettings = ({
  selectedCamera,
  selectedStream,
  isStreaming,
  isIntervalCapturing,
  onIntervalCapturingChange: setIsIntervalCapturing,
  onSelectCamera,
  onSelectStream,
  onStreamSwitchingChange,
  mediaStream,
}: CaptureSettingsProps) => {
  const { isRecording } = useVideoCapture();

  // Holds the resolver of a camera/stream switch intercepted while a capture
  // is running; StopCaptureDialog resolves it via onClose.
  const [pendingSwitch, setPendingSwitch] = useState<{
    resolve: (proceed: boolean) => void;
  } | null>(null);

  const confirmSwitch = useCallback((): Promise<boolean> => {
    if (!isRecording && !isIntervalCapturing) return Promise.resolve(true);
    return new Promise<boolean>((resolve) => setPendingSwitch({ resolve }));
  }, [isRecording, isIntervalCapturing]);

  const handleDialogClose = (proceed: boolean) => {
    pendingSwitch?.resolve(proceed);
    setPendingSwitch(null);
  };

  return (
    <div className="flex flex-col gap-4 border-r border-black/10 bg-black/[0.03] p-4 pl-6">
      <p className="text-[10px] font-bold uppercase tracking-wider text-black">
        Capture Settings
      </p>
      <SelectCamera
        value={selectedCamera}
        onSelect={onSelectCamera}
        onBeforeUserSelect={confirmSwitch}
      />
      <SelectStream
        mxid={selectedCamera}
        value={selectedStream}
        onSelect={onSelectStream}
        onSwitchingChange={onStreamSwitchingChange}
        onBeforeUserSelect={confirmSwitch}
      />

      {selectedCamera && (
        <>
          <CaptureStillImage
            selectedCamera={selectedCamera}
            selectedStream={selectedStream}
            isStreaming={isStreaming}
            isIntervalCapturing={isIntervalCapturing}
            onIntervalCapturingChange={setIsIntervalCapturing}
          />

          <CaptureVideo
            mediaStream={mediaStream}
            isStreaming={isStreaming}
          />
        </>
      )}

      {selectedCamera && (
        <div className="mt-auto border-t border-black/10 pt-4">
          <RestartCameraButton
            mxid={selectedCamera}
            streamName={selectedStream}
            isIntervalCapturing={isIntervalCapturing}
            onBeforeRestart={() => setIsIntervalCapturing(false)}
          />
        </div>
      )}

      <StopCaptureDialog
        open={pendingSwitch !== null}
        isIntervalCapturing={isIntervalCapturing}
        onIntervalCapturingChange={setIsIntervalCapturing}
        onClose={handleDialogClose}
      />
    </div>
  );
};
