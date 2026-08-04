import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { useParams } from "react-router";
import { LiveInference } from "../LiveInference/LiveInference";

interface CameraPreviewProps {
  imageUrl: string | undefined;
  selectedCamera: string | null;
  selectedStream: string | null;
}

export const CameraPreview = ({
  imageUrl,
  selectedCamera,
  selectedStream,
}: CameraPreviewProps) => {
  const [activeProject] = useActiveProject();
  const { projectId: urlProjectId } = useParams<{ projectId: string }>();
  const isSwitchingProject =
    !activeProject || String(activeProject.id) !== urlProjectId;

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
    </div>
  );
};
