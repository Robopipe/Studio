import z from "zod";
import {
  evalLimitCreateOrUpdateSchema,
  evalLimitDetailSchema,
  evalLimitItemSchema,
  evalLimitSchema,
  evalLogicNodeSchema,
  evalTestCaseCreateOrUpdateSchema,
  evalTestCaseDetailSchema,
  evalTestCaseSchema,evalTestCaseThresholdSchema,evalThresholdCreateOrUpdateSchema, evalThresholdSchema
} from "./eval.schema";


export type EvalTestCaseThreshold = z.infer<typeof evalTestCaseThresholdSchema>;
export type EvalThresholdCreateOrUpdate = z.infer<typeof evalThresholdCreateOrUpdateSchema>;
export type EvalThreshold = z.infer<typeof evalThresholdSchema>;
export type EvalLogicNode = z.infer<typeof evalLogicNodeSchema>;
export type EvalLimitItem = z.infer<typeof evalLimitItemSchema>;
export type EvalLimit = z.infer<typeof evalLimitSchema>;
export type EvalLimitDetail = z.infer<typeof evalLimitDetailSchema>;
export type EvalTestCase = z.infer<typeof evalTestCaseSchema>;
export type EvalTestCaseDetail = z.infer<typeof evalTestCaseDetailSchema>;
export type EvalTestCaseCreateOrUpdate = z.infer<
  typeof evalTestCaseCreateOrUpdateSchema
>;
export type EvalLimitCreateOrUpdate = z.infer<
  typeof evalLimitCreateOrUpdateSchema
>;
