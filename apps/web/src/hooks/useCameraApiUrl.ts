import { useAuth } from "@/core/auth/hooks";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";

/**
 * Resolves the camera API base URL based on the active project and user settings.
 * Priority: project.cameraApiUrl (if non-null) > user.cameraApiUrl
 */
export const useCameraApiUrl = (): string | null => {
  const { user } = useAuth();
  const [activeProject] = useActiveProject();

  return activeProject?.cameraApiUrl ?? user?.cameraApiUrl ?? null;
};
