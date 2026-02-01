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
