import z from "zod";
import { timestampsSchema } from "../helpers";

export const projectSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  cameraApiUrl: z.url().nullable(),
  cameraMxid: z.string().nullable(),
  multipleDashboardConfigs: z.boolean(),
  hasLicense: z.boolean(),
  organizationId: z.number(),
  taskCount: z.number(),
  annotatedTaskCount: z.number(),
  ...timestampsSchema,
});

export const createProjectRequestSchema = z.object({
  name: z.string().min(1).max(256),
  description: z.string(),
  cameraApiUrl: z.url().nullable(),
  cameraMxid: z.string().max(256).nullish(),
});

export const updateProjectRequestSchema = z.object({
  name: z.string().min(1).max(256),
  description: z.string(),
  cameraApiUrl: z.url().nullable(),
  cameraMxid: z.string().max(256).nullish(),
  multipleDashboardConfigs: z.boolean().optional(),
});

// ProjectTypeEnum is used by model training, not by projects themselves.
export enum ProjectTypeEnum {
  CLASSIFICATION = "CLASSIFICATION",
  DETECTION = "DETECTION",
  SEGMENTATION = "SEGMENTATION",
}

export const projectListResponseSchema = z.object({
  projects: z.array(projectSchema),
});
