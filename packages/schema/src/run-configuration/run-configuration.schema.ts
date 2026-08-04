import z from "zod";
import { timestampsSchema } from "../helpers";

export const runConfigurationSchema = z.object({
  id: z.number(),
  projectId: z.number(),
  modelId: z.number().nullable(),
  streamName: z.string().nullable(),
  capturedVideoId: z.number().nullable(),
  createdAt: timestampsSchema.createdAt,
  updatedAt: timestampsSchema.updatedAt,
});

export const updateRunConfigurationSchema = z.object({
  modelId: z.number().nullable().optional(),
  streamName: z.string().max(256).nullable().optional(),
  capturedVideoId: z.number().nullable().optional(),
});
