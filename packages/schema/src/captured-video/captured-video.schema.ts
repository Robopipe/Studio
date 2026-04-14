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

export const capturedVideoPaginationQuerySchema = paginationQuerySchema.extend({
  order: z
    .union([z.literal("asc"), z.literal("desc")])
    .optional()
    .default("desc"),
});

export const paginatedCapturedVideoSchema = paginatedResponseSchema(capturedVideoSchema);

export const requestVideoUploadUrlsSchema = z.object({
  videoFileName: z.string().min(1),
  videoContentType: z.string().min(1),
  thumbnailFileName: z.string().min(1),
  thumbnailContentType: z.string().min(1),
});

export const videoUploadUrlsResponseSchema = z.object({
  videoSignedUrl: z.string().url(),
  videoGcsPath: z.string(),
  thumbnailSignedUrl: z.string().url(),
  thumbnailGcsPath: z.string(),
});

export const confirmVideoUploadSchema = z.object({
  videoGcsPath: z.string().min(1),
  thumbnailGcsPath: z.string().min(1),
  durationMs: z.number().int().min(0),
  fileSizeBytes: z.number().int().min(0),
});
