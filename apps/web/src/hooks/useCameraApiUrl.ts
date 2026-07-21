import { useActiveProject } from "@/modules/project/hooks/useActiveProject";

/** Camera API URL of the active project (stored on the project in the DB). */
export const useCameraApiUrl = (): string | null => {
  const [activeProject] = useActiveProject();
  return activeProject?.cameraApiUrl ?? null;
};
