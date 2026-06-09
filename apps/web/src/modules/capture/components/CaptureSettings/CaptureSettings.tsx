import { CaptureStillImage } from "../CaptureStillImage";
import { CaptureVideo } from "../CaptureVideo";
import { RestartCameraButton } from "../RestartCameraButton/RestartCameraButton";
import { SelectCamera } from "../SelectCamera";
import { SelectStream } from "../SelectStream";

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

  return (
    <div className="flex flex-col gap-4 border-r border-black/10 bg-black/[0.03] p-4 pl-6">
      <p className="text-[10px] font-bold uppercase tracking-wider text-black">
        Capture Settings
      </p>
      <SelectCamera value={selectedCamera} onSelect={onSelectCamera} />
      <SelectStream
        mxid={selectedCamera}
        value={selectedStream}
        onSelect={onSelectStream}
        onSwitchingChange={onStreamSwitchingChange}
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
    </div>
  );
};
