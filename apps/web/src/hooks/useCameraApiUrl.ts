import {
  selectActiveOverride,
  selectEffectiveCameraApiUrl,
} from "@/modules/project/services/cameraApiOverrideSlice";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import { useSelector } from "react-redux";

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

export const useCameraApiUrl = (): CameraApiUrlInfo => {
  const [activeProject] = useActiveProject();
  const override = useSelector(selectActiveOverride);
  const url = useSelector(selectEffectiveCameraApiUrl);
  const projectUrl = activeProject?.cameraApiUrl ?? null;

  return {
    url,
    projectUrl,
    override,
    isOverride: !!override,
  };
};
