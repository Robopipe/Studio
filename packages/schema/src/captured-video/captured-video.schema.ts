import z from "zod";
import { paginatedResponseSchema, paginationQuerySchema, timestampsSchema } from "../helpers";

export const capturedVideoSchema = z.object({
  id: z.number(),
  projectId: z.number(),
  fileUrl: z.string(),
  thumbnailUrl: z.string(),
  durationMs: z.number().int(),
  fileSizeBytes: z.number().int(),
  ...timestampsSchema,
});

export const createCapturedVideoQuerySchema = z.object({
  durationMs: z.coerce.number().int().min(0),
});

export const capturedVideoPaginationQuerySchema = paginationQuerySchema.extend({
  order: z
    .union([z.literal("asc"), z.literal("desc")])
    .optional()
    .default("desc"),
});

export const paginatedCapturedVideoSchema = paginatedResponseSchema(capturedVideoSchema);
