import {
  ZoneArrow,
  ZoneConfig,
  getZoneStyle,
} from "@/modules/dashboard/components/DashboardZoneConfiguration";
import { LiveInference } from "../LiveInference/LiveInference";

interface CameraPreviewProps {
  imageUrl: string | undefined;
  zoneConfig: ZoneConfig;
  selectedCamera: string | null;
  selectedStream: string | null;
}

export const CameraPreview = ({
  imageUrl,
  zoneConfig,
  selectedCamera,
  selectedStream,
}: CameraPreviewProps) => {
  const centerPct = zoneConfig.zoneCenter;
  const thicknessPct = zoneConfig.zoneThickness;

  return (
    <div className="relative aspect-video w-full max-w-full overflow-hidden rounded-xl bg-black/5">
      {selectedCamera && selectedStream ? (
        <LiveInference
          selectedCamera={selectedCamera}
          selectedStream={selectedStream}
        />
      ) : (
        imageUrl && (
          <img
            className="block h-full w-full object-cover"
            src={imageUrl}
            alt="Camera preview"
          />
        )
      )}
      <div
        style={getZoneStyle(zoneConfig.zoneDirection, centerPct, thicknessPct)}
      />
      <ZoneArrow direction={zoneConfig.zoneDirection} centerPct={centerPct} />
    </div>
  );
};
