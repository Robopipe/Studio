import { EvalTestCaseSeverityEnum, EvalTestCaseTypeEnum } from "@repo/schema";
import { z } from "zod";

export const createTestCaseFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(EvalTestCaseTypeEnum),
  severity: z.enum(EvalTestCaseSeverityEnum),
});

export type CreateTestCaseFormSchema = z.infer<typeof createTestCaseFormSchema>;
