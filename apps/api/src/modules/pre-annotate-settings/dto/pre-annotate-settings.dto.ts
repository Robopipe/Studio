import { createZodDto } from "nestjs-zod";
import { PreAnnotateModelTypeEnum } from "@repo/schema";
import z from "zod";

// Flat schema for DTO validation — accepts all fields across model types.
// The controller validates modelType consistency with the path param.
const preAnnotateSettingsDtoSchema = z.object({
  modelType: z.nativeEnum(PreAnnotateModelTypeEnum),
  modelId: z.number().int().positive().nullable(),
  conf: z.number().min(0).max(1),
  iou: z.number().min(0).max(1),
  minAreaPx: z.number().int().min(0).max(10000),
  polyEpsilon: z.number().min(0).max(0.05).optional(),
  maskThreshold: z.number().min(0).max(1).optional(),
  fillConcavityLabelIds: z.number().int().positive().array().optional(),
});

export class PreAnnotateSettingsDto extends createZodDto(preAnnotateSettingsDtoSchema) {}
