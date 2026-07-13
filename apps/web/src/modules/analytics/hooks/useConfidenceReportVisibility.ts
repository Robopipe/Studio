import { useAuth } from "@/core/auth/hooks";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { useActiveProject } from "@/modules/project/hooks/useActiveProject";
import type { RootState } from "@/store/types";
import { useCallback, useEffect } from "react";
import {
  hydrateProjectVisibility,
  setShowInDataset as setShowInDatasetAction,
} from "../services/confidenceReportVisibilitySlice";
import { readShowInDataset } from "../utils/confidenceReportVisibilityStorage";

export interface UseConfidenceReportVisibilityReturn {
  showInDataset: boolean;
  setShowInDataset: (next: boolean) => void;
}

/**
 * "Show in dataset" preference for the confidence report — a per-user,
 * per-project display setting toggled in the AnalyticsDialog. Source of
 * truth: Redux slice (confidenceReportVisibilitySlice), hydrated lazily per
 * project from localStorage on first access, then written through on every
 * change. Defaults to visible when nothing is stored, so the unhydrated and
 * default values agree and there is no flicker.
 */
export const useConfidenceReportVisibility =
  (): UseConfidenceReportVisibilityReturn => {
    const { user } = useAuth();
    const [activeProject] = useActiveProject();
    const dispatch = useAppDispatch();

    const userId = user?.id;
    const projectId = activeProject?.id;

    const entry = useAppSelector((state: RootState) =>
      projectId != null
        ? state.confidenceReportVisibility.byProject[projectId]
        : undefined,
    );

    // Hydrate the slice from localStorage the first time this project is
    // seen. Idempotent across the multiple components that call this hook.
    useEffect(() => {
      if (projectId == null) return;
      if (entry !== undefined) return;
      dispatch(
        hydrateProjectVisibility({
          projectId,
          showInDataset: readShowInDataset(userId, projectId) ?? true,
        }),
      );
    }, [dispatch, projectId, entry, userId]);

    const setShowInDataset = useCallback(
      (next: boolean) => {
        if (userId == null || projectId == null) return;
        dispatch(
          setShowInDatasetAction({ userId, projectId, showInDataset: next }),
        );
      },
      [dispatch, projectId, userId],
    );

    return {
      showInDataset: entry ?? true,
      setShowInDataset,
    };
  };
