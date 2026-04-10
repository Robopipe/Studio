import { CaptureStillImage } from "../CaptureStillImage";
import { SelectCamera } from "../SelectCamera";
import { SelectStream } from "../SelectStream";

export interface CaptureSettingsProps {
  selectedCamera: string | null;
  selectedStream: string | null;
  onSelectCamera: (camera: string | null) => void;
  onSelectStream: (stream: string | null) => void;
}

export const CaptureSettings = ({
  selectedCamera,
  selectedStream,
  onSelectCamera,
  onSelectStream,
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
      />

      {selectedCamera && selectedStream && (
        <CaptureStillImage
          selectedCamera={selectedCamera}
          selectedStream={selectedStream}
        />
      )}
    </div>
  );
};
