import type { RootState } from "@/store";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Project } from "@repo/schema";

export interface ProjectState {
  activeProject: Project | null;
}

const initialState: ProjectState = {
  activeProject: null,
};

export const projectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {
    setActiveProject: (state, { payload }: PayloadAction<Project | null>) => {
      sessionStorage.setItem("activeProjectId", JSON.stringify(payload?.id));
      state.activeProject = payload;
    },
  },
});

/** The active project's camera API URL — the single source for camera API requests. */
export const selectCameraApiUrl = (state: RootState): string | null =>
  state.project.activeProject?.cameraApiUrl ?? null;
