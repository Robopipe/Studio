import {
  ZoneArrow,
  ZoneConfig,
  getZoneStyle,
} from "@/modules/dashboard/components/DashboardZoneConfiguration";

interface CameraPreviewProps {
  imageUrl: string | undefined;
  zoneConfig: ZoneConfig;
}

export const CameraPreview = ({ imageUrl, zoneConfig }: CameraPreviewProps) => {
  const centerPct = zoneConfig.zoneCenter;
  const thicknessPct = zoneConfig.zoneThickness;

  return (
    <div className="relative m-6 flex-1 self-center overflow-hidden rounded-xl aspect-video">
      <img
        className="block h-full w-full object-cover"
        src={imageUrl}
        alt="Camera preview"
      />
      <div
        style={getZoneStyle(zoneConfig.zoneDirection, centerPct, thicknessPct)}
      />
      <ZoneArrow direction={zoneConfig.zoneDirection} centerPct={centerPct} />
    </div>
  );
};
