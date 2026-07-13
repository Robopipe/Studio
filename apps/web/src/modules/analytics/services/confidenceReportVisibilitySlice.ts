import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { writeShowInDataset } from "../utils/confidenceReportVisibilityStorage";

/**
 * Per-user, per-project "Show in dataset" preference for the confidence
 * report: whether report-derived per-task UI (metric badges on task cards,
 * the Inferred tab, region IoU pills) is shown. Display-only — never affects
 * report runs or dataset-level results.
 *
 * Hydrated lazily per-project from localStorage (see
 * confidenceReportVisibilityStorage.ts) via useConfidenceReportVisibility,
 * then written through on every change. Missing entry means "not hydrated
 * yet"; consumers default to visible.
 */
export interface ConfidenceReportVisibilityState {
  byProject: Record<number, boolean>;
}

const initialState: ConfidenceReportVisibilityState = {
  byProject: {},
};

export const confidenceReportVisibilitySlice = createSlice({
  name: "confidenceReportVisibility",
  initialState,
  reducers: {
    /**
     * Seed the in-memory slice from localStorage when a project first becomes
     * active. Does not write back — pure hydration.
     */
    hydrateProjectVisibility: (
      state,
      { payload }: PayloadAction<{ projectId: number; showInDataset: boolean }>,
    ) => {
      state.byProject[payload.projectId] = payload.showInDataset;
    },
    setShowInDataset: (
      state,
      {
        payload,
      }: PayloadAction<{
        userId: number;
        projectId: number;
        showInDataset: boolean;
      }>,
    ) => {
      state.byProject[payload.projectId] = payload.showInDataset;
      writeShowInDataset(
        payload.userId,
        payload.projectId,
        payload.showInDataset,
      );
    },
  },
});

export const { hydrateProjectVisibility, setShowInDataset } =
  confidenceReportVisibilitySlice.actions;
