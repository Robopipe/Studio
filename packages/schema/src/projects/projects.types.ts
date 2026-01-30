import z from "zod";
import {
  projectSchema,
  createProjectRequestSchema,
  updateProjectRequestSchema,
  projectListResponseSchema,
} from "./projects.schema";

export type Project = z.infer<typeof projectSchema>;
export type CreateProjectRequest = z.infer<typeof createProjectRequestSchema>;
export type UpdateProjectRequest = z.infer<typeof updateProjectRequestSchema>;
export type ProjectListResponse = z.infer<typeof projectListResponseSchema>;
