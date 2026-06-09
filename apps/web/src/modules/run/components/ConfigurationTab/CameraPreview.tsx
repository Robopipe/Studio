import {
  ZoneArrow,
  ZoneConfig,
  centerThicknessToSafeBounds,
  getSafeZoneStyles,
} from "@/modules/dashboard/components/DashboardZoneConfiguration";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { useParams } from "react-router";
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
  const [activeProject] = useActiveProject();
  const { projectId: urlProjectId } = useParams<{ projectId: string }>();
  const isSwitchingProject =
    !activeProject || String(activeProject.id) !== urlProjectId;

  const { safeStartPct, safeEndPct } = centerThicknessToSafeBounds(
    zoneConfig.zoneCenter,
    zoneConfig.zoneThickness,
  );
  const safeStyles = getSafeZoneStyles(
    zoneConfig.zoneDirection,
    safeStartPct,
    safeEndPct,
  );

  return (
    <div className="relative aspect-video w-full max-w-full overflow-hidden rounded-xl bg-black/5">
      {!isSwitchingProject && selectedCamera && selectedStream ? (
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
      <div style={safeStyles.start} />
      <div style={safeStyles.end} />
      <ZoneArrow
        direction={zoneConfig.zoneDirection}
        centerPct={zoneConfig.zoneCenter}
      />
    </div>
  );
};
