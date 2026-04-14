import { createZodDto } from "nestjs-zod";
import {
  capturedVideoSchema,
  capturedVideoPaginationQuerySchema,
  paginatedCapturedVideoSchema,
  requestVideoUploadUrlsSchema,
  confirmVideoUploadSchema,
} from "@repo/schema";

export class CapturedVideoResponse extends createZodDto(capturedVideoSchema) {}
export class CapturedVideoPaginationQuery extends createZodDto(capturedVideoPaginationQuerySchema) {}
export class PaginatedCapturedVideoResponse extends createZodDto(paginatedCapturedVideoSchema) {}
export class RequestVideoUploadUrlsBody extends createZodDto(requestVideoUploadUrlsSchema) {}
export class ConfirmVideoUploadBody extends createZodDto(confirmVideoUploadSchema) {}
