import z from "zod";
import {
  capturedVideoSchema,
  capturedVideoPaginationQuerySchema,
  paginatedCapturedVideoSchema,
  requestVideoUploadUrlsSchema,
  videoUploadUrlsResponseSchema,
  confirmVideoUploadSchema,
} from "./captured-video.schema";

export type CapturedVideo = z.infer<typeof capturedVideoSchema>;
export type CapturedVideoPaginationQuery = z.infer<typeof capturedVideoPaginationQuerySchema>;
export type PaginatedCapturedVideos = z.infer<typeof paginatedCapturedVideoSchema>;
export type RequestVideoUploadUrls = z.infer<typeof requestVideoUploadUrlsSchema>;
export type VideoUploadUrlsResponse = z.infer<typeof videoUploadUrlsResponseSchema>;
export type ConfirmVideoUpload = z.infer<typeof confirmVideoUploadSchema>;
