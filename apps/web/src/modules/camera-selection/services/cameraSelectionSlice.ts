import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  CameraSelection,
  writeCameraSelection,
} from "../utils/cameraSelectionStorage";

/**
 * Per-project camera+stream selection. Authoritative for:
 *   - Capture page live view
 *   - Run page LiveInference view
 *   - "Model is running!" banner on Capture
 *   - Deploy from Run
 *
 * Changes made anywhere (Capture dropdowns, ConfigurationTab selectors) write
 * here so every screen stays in sync. Hydrated lazily per-project from
 * localStorage (see cameraSelectionStorage.ts) via the useSelectedCameraStream
 * hook, so this slice only holds projects the user has interacted with this
 * session.
 */
export interface CameraSelectionState {
  byProject: Record<number, CameraSelection>;
}

const initialState: CameraSelectionState = {
  byProject: {},
};

interface SetSelectionPayload {
  userId: number;
  projectId: number;
  selection: CameraSelection;
}

export const cameraSelectionSlice = createSlice({
  name: "cameraSelection",
  initialState,
  reducers: {
    /**
     * Seed the in-memory slice from localStorage when a project first becomes
     * active. Does not write back — pure hydration.
     */
    hydrateProjectSelection: (
      state,
      { payload }: PayloadAction<{ projectId: number; selection: CameraSelection }>,
    ) => {
      state.byProject[payload.projectId] = payload.selection;
    },
    setSelection: (state, { payload }: PayloadAction<SetSelectionPayload>) => {
      state.byProject[payload.projectId] = payload.selection;
      writeCameraSelection(payload.userId, payload.projectId, payload.selection);
    },
    setCamera: (
      state,
      {
        payload,
      }: PayloadAction<{ userId: number; projectId: number; cameraMxid: string | null }>,
    ) => {
      // Changing the camera clears the stream — the previously-selected stream
      // may not exist on the new camera. Callers (hooks) re-pick a default.
      const next: CameraSelection = {
        cameraMxid: payload.cameraMxid,
        streamName: null,
      };
      state.byProject[payload.projectId] = next;
      writeCameraSelection(payload.userId, payload.projectId, next);
    },
    setStream: (
      state,
      {
        payload,
      }: PayloadAction<{ userId: number; projectId: number; streamName: string | null }>,
    ) => {
      const current = state.byProject[payload.projectId] ?? {
        cameraMxid: null,
        streamName: null,
      };
      const next: CameraSelection = {
        cameraMxid: current.cameraMxid,
        streamName: payload.streamName,
      };
      state.byProject[payload.projectId] = next;
      writeCameraSelection(payload.userId, payload.projectId, next);
    },
  },
});

export const { hydrateProjectSelection, setSelection, setCamera, setStream } =
  cameraSelectionSlice.actions;
