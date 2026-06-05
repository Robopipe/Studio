import type { AppDispatch, RootState } from "@/store";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  writeCameraApiOverride,
} from "../utils/cameraApiOverride";

const STORAGE_PREFIX = "cameraApiOverride";

export interface CameraApiOverrideState {
  overrides: Record<string, string | null>;
}

function loadFromStorage(): Record<string, string | null> {
  const overrides: Record<string, string | null> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX + ":")) {
        const shortKey = key.slice(STORAGE_PREFIX.length + 1);
        overrides[shortKey] = localStorage.getItem(key);
      }
    }
  } catch {
    // ignore storage failures
  }
  return overrides;
}

export const cameraApiOverrideSlice = createSlice({
  name: "cameraApiOverride",
  initialState: (): CameraApiOverrideState => ({
    overrides: loadFromStorage(),
  }),
  reducers: {
    setOverride(
      state,
      action: PayloadAction<{
        userId: number;
        projectId: number;
        value: string | null;
      }>,
    ) {
      const { userId, projectId, value } = action.payload;
      const key = `${userId}:${projectId}`;
      if (value) {
        state.overrides[key] = value;
      } else {
        delete state.overrides[key];
      }
    },
  },
});

export const setCameraApiOverride =
  (payload: { userId: number; projectId: number; value: string | null }) =>
  (dispatch: AppDispatch) => {
    writeCameraApiOverride(payload.userId, payload.projectId, payload.value);
    dispatch(cameraApiOverrideSlice.actions.setOverride(payload));
  };

export const selectActiveOverride = (state: RootState): string | null => {
  const userId = state.auth.user?.id;
  const projectId = state.project.activeProject?.id;
  if (userId == null || projectId == null) return null;
  return state.cameraApiOverride.overrides[`${userId}:${projectId}`] ?? null;
};

export const selectEffectiveCameraApiUrl = (state: RootState): string | null => {
  const override = selectActiveOverride(state);
  const projectUrl = state.project.activeProject?.cameraApiUrl ?? null;
  return override ?? projectUrl;
};
