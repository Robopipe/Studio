import { EvalSeverityEnum, EvalTestCaseTypeEnum } from "@repo/schema";
import { z } from "zod";

export const createTestCaseFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(EvalTestCaseTypeEnum),
  severity: z.enum(EvalSeverityEnum).nullable(),
  enabled: z.boolean(),
});

export type CreateTestCaseFormSchema = z.infer<typeof createTestCaseFormSchema>;
