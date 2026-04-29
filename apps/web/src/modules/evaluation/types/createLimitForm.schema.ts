import {
  EvalLimitItemOperatorEnum,
  EvalLimitItemParameterEnum,
  EvalLimitItemQuantifierTypeEnum,
  EvalLimitItemQuantifierUnitEnum,
  EvalSeverityEnum,
} from "@repo/schema";
import { z } from "zod";

const limitItemFormSchema = z.object({
  id: z.string().nullable(),
  limitFrom: z.number().nullable(),
  limitTo: z.number().nullable(),
  parameter: z.enum(EvalLimitItemParameterEnum),
  operator: z.enum(EvalLimitItemOperatorEnum),
  quantifierType: z.enum(EvalLimitItemQuantifierTypeEnum),
  quantifierUnit: z.enum(EvalLimitItemQuantifierUnitEnum),
  quantifierValue: z.number(),
});

export const createLimitFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  severity: z.enum(EvalSeverityEnum).nullable(),
  enabled: z.boolean(),
  targetLabelId: z.number().min(1, "Label is required"),
  targetParentLabelId: z.number().nullable(),
  limitItems: z
    .array(limitItemFormSchema)
    .min(1, "At least one limit item is required"),
});

export type CreateLimitFormSchema = z.infer<typeof createLimitFormSchema>;
export type LimitItemFormSchema = z.infer<typeof limitItemFormSchema>;
