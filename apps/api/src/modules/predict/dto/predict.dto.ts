import { createZodDto } from "nestjs-zod";
import { PreAnnotateModelTypeEnum } from "@repo/schema";
import z from "zod";

// Flat schema for DTO validation — accepts all fields across model types.
// The service narrows on modelType for per-type logic.
const predictRequestDtoSchema = z.object({
  modelType: z.nativeEnum(PreAnnotateModelTypeEnum),
  modelId: z.number().int().positive(),
  conf: z.number().min(0).max(1).optional(),
  iou: z.number().min(0).max(1).optional(),
  polyEpsilon: z.number().min(0).max(0.05).optional(),
  maskThreshold: z.number().min(0).max(1).optional(),
  minAreaPx: z.number().min(0).max(10000).optional(),
  fillConcavityLabelIds: z.number().int().positive().array().optional(),
});

export class PredictRequestDto extends createZodDto(predictRequestDtoSchema) {}
