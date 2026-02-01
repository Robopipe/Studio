import { useAppDispatch, useAppSelector } from "@/hooks";
import { RootState } from "@/store";
import { Project } from "@repo/schema";
import { useCallback } from "react";
import { setActiveProject as setActiveProjectAction } from "../services/projectActions";

export const useActiveProject = () => {
  const activeProject = useAppSelector(
    (state: RootState) => state.project.activeProject,
  );

  const dispatch = useAppDispatch();
  const setActiveProject = useCallback(
    (project: Project | null) => {
      dispatch(setActiveProjectAction(project));
    },
    [dispatch],
  );

  return [activeProject, setActiveProject] as const;
};
