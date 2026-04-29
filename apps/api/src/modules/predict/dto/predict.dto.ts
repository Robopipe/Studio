import { createZodDto } from "nestjs-zod";
import { predictRequestSchema, predictResponseSchema } from "@repo/schema";

export class PredictRequestDto extends createZodDto(predictRequestSchema) {}
export class PredictResponseDto extends createZodDto(predictResponseSchema) {}
