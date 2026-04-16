import { useAuth } from "@/core/auth/hooks";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { readCameraApiOverride } from "@/modules/project/utils/cameraApiOverride";

export interface CameraApiUrlInfo {
  /** Effective URL used for camera API requests (override or project). */
  url: string | null;
  /** Project's stored camera API URL. */
  projectUrl: string | null;
  /** Local-storage override for the current (user, project) pair. */
  override: string | null;
  /** True when the effective URL comes from the local override. */
  isOverride: boolean;
}

/**
 * Resolves the camera API base URL for the active project, preferring the
 * current user's local override (stored in localStorage) when set.
 */
export const useCameraApiUrl = (): CameraApiUrlInfo => {
  const { user } = useAuth();
  const [activeProject] = useActiveProject();

  const override = readCameraApiOverride(user?.id, activeProject?.id);
  const projectUrl = activeProject?.cameraApiUrl ?? null;
  const url = override ?? projectUrl;

  return {
    url,
    projectUrl,
    override,
    isOverride: !!override,
  };
};
