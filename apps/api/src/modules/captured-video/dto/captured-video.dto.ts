import { createZodDto } from "nestjs-zod";
import {
  capturedVideoSchema,
  createCapturedVideoQuerySchema,
  capturedVideoPaginationQuerySchema,
  paginatedCapturedVideoSchema,
} from "@repo/schema";

export class CapturedVideoResponse extends createZodDto(capturedVideoSchema) {}
export class CreateCapturedVideoQuery extends createZodDto(createCapturedVideoQuerySchema) {}
export class CapturedVideoPaginationQuery extends createZodDto(capturedVideoPaginationQuerySchema) {}
export class PaginatedCapturedVideoResponse extends createZodDto(paginatedCapturedVideoSchema) {}
