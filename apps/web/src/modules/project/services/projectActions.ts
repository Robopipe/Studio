import { createAction } from "@reduxjs/toolkit";
import { Project } from "@repo/schema";

export const setActiveProject = createAction<Project | null>(
  "project/setActiveProject",
);
