import z from "zod";
import {
  capturedVideoSchema,
  createCapturedVideoQuerySchema,
  capturedVideoPaginationQuerySchema,
  paginatedCapturedVideoSchema,
} from "./captured-video.schema";

export type CapturedVideo = z.infer<typeof capturedVideoSchema>;
export type CreateCapturedVideoQuery = z.infer<typeof createCapturedVideoQuerySchema>;
export type CapturedVideoPaginationQuery = z.infer<typeof capturedVideoPaginationQuerySchema>;
export type PaginatedCapturedVideos = z.infer<typeof paginatedCapturedVideoSchema>;
