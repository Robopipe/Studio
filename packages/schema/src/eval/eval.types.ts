import z from "zod";
import { evalLimitDetailSchema, evalLimitItemSchema, evalLimitSchema, evalLogicNodeSchema, evalTestCaseDetailSchema, evalTestCaseSchema } from "./eval.schema";

export type EvalLogicNode = z.infer<typeof evalLogicNodeSchema>
export type EvalLimitItem = z.infer<typeof evalLimitItemSchema>
export type EvalLimit = z.infer<typeof evalLimitSchema>
export type EvalLimitDetail = z.infer<typeof evalLimitDetailSchema>
export type EvalTestCase = z.infer<typeof evalTestCaseSchema>
export type EvalTestCaseDetail = z.infer<typeof evalTestCaseDetailSchema>
