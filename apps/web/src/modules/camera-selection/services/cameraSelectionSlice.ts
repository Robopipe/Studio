import type { RootState } from "@/store";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/**
 * Per-project stream selection, session-only. The camera itself is a project
 * setting stored in the DB (project.cameraMxid, set via the project modal) —
 * this slice only remembers which stream was picked for that camera during
 * the current session. Each entry keeps the camera it was picked for, so a
 * camera change (project modal save, or an edit by another user landing via
 * the Projects refetch) atomically invalidates the stream: the selector
 * returns null until a stream is re-picked for the new camera.
 */
export interface StreamSelection {
  /** Camera the stream was chosen for. */
  cameraMxid: string | null;
  streamName: string | null;
}

export interface CameraSelectionState {
  byProject: Record<number, StreamSelection>;
}

const initialState: CameraSelectionState = {
  byProject: {},
};

export const cameraSelectionSlice = createSlice({
  name: "cameraSelection",
  initialState,
  reducers: {
    setStream: (
      state,
      {
        payload,
      }: PayloadAction<{
        projectId: number;
        cameraMxid: string | null;
        streamName: string | null;
      }>,
    ) => {
      state.byProject[payload.projectId] = {
        cameraMxid: payload.cameraMxid,
        streamName: payload.streamName,
      };
    },
  },
});

export const { setStream } = cameraSelectionSlice.actions;

/** The active project's camera (mxid), stored on the project in the DB. */
export const selectActiveCameraMxid = (state: RootState): string | null =>
  state.project.activeProject?.cameraMxid ?? null;

/**
 * Stream selected for the active project this session — only returned when it
 * was picked for the project's current camera; null after a camera change.
 */
export const selectActiveStreamName = (state: RootState): string | null => {
  const project = state.project.activeProject;
  if (!project) return null;
  const entry = state.cameraSelection.byProject[project.id];
  if (!entry) return null;
  return entry.cameraMxid === project.cameraMxid ? entry.streamName : null;
};
