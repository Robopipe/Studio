import { CameraDisplay } from "../CameraDisplay";
import { ImageProfile } from "../ImageProfile";

export interface LiveCaptureProps {
  selectedCamera: string | null;
  selectedStream: string | null;
}

export const LiveCapture = ({
  selectedCamera,
  selectedStream,
}: LiveCaptureProps) => {
  return (
    <div className="flex flex-col gap-4 p-6">
      <p className="text-xl font-bold">Capture images live</p>

      {selectedCamera && selectedStream && (
        <>
          <CameraDisplay
            selectedMxid={selectedCamera}
            selectedSensorName={selectedStream}
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
