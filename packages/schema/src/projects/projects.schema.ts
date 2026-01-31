import z from "zod";
import { timestampsSchema } from "../helpers";

export enum ProjectTypeEnum {
  CLASSIFICATION = "CLASSIFICATION",
  DETECTION = "DETECTION",
  SEGMENTATION = "SEGMENTATION",
}

export const projectSchema = z.object({
  id: z.number(),
  name: z.string(),
  organizationId: z.number(),
  ...timestampsSchema
});

export const createProjectRequestSchema = z.object({
  name: z.string().min(1).max(256),
  type: z.enum(ProjectTypeEnum)
});

export const updateProjectRequestSchema = z.object({
  name: z.string().min(1).max(256),
});

export const projectListResponseSchema = z.object({
  projects: z.array(projectSchema),
});
