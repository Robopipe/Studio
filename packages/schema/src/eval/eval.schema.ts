import z from "zod";
import { timestampsSchema } from "../helpers";
import { labelSchema } from "../label";

/**
 * EVAL entities
 */

export enum EvalTestCaseTypeEnum {
  CHECK = 'CHECK',
  DEFECT = 'DEFECT',
}

export enum EvalTestCaseSeverityEnum {
  ALERT = 'ALERT',
  WARNING = 'WARNING'
}

export enum EvalLimitItemParameterEnum {
  POS_LEFT = "POS_LEFT", // %
  POS_RIGHT = "POS_RIGHT", // %
  POS_TOP = "POS_TOP", // %
  POS_BOTTOM = "POS_BOTTOM", // %
  POS_CENTER = "POS_CENTER", // %
  AREA = "AREA", // %
  COUNT = "COUNT", // pcs
}

export enum EvalLimitItemOperatorEnum {
  AND = "AND",
  OR = "OR"
}

/* Eval limit item */
export const evalLimitItemSchema = z.object({
  id: z.uuidv7(),
  limitFrom: z.number().nullable(),
  limitTo: z.number().nullable(),
  parameter: z.enum(EvalLimitItemParameterEnum),
  operator: z.enum(EvalLimitItemOperatorEnum), // Operator "after" the limit item
  createdAt: timestampsSchema.createdAt,
  updatedAt: timestampsSchema.updatedAt
}).refine((limitItem) => limitItem.limitFrom !== null || limitItem.limitTo !== null, {
  message: "At least one of limitFrom or limitTo must be provided"
})

/* Eval limit */
export const evalLimitSchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  targetLabel: labelSchema,
  targetParentLabel: labelSchema.nullable(),
  createdAt: timestampsSchema.createdAt,
  updatedAt: timestampsSchema.updatedAt
})

/* Eval limit detail -> With limit items */
export const evalLimitDetailSchema = evalLimitSchema.extend({
  limitItems: z.array(evalLimitItemSchema)
})

/* Eval test case -> With limits */
export const evalTestCaseSchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  type: z.enum(EvalTestCaseTypeEnum),
  severity: z.enum(EvalTestCaseSeverityEnum),
  limits: z.array(evalLimitSchema), // Always required
  createdAt: timestampsSchema.createdAt,
  updatedAt: timestampsSchema.updatedAt
})


/**
 * EVAL logic entities
 */

export enum EvalLogicNodeTypeEnum {
  GROUP = 'GROUP',
  LIMIT = 'LIMIT',
  OPERATOR = 'OPERATOR'
}

export enum EvalLogicNodeOperatorValueEnum {
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT'
}

export const evalLogicNodeSchema = z.union([
  z.object({
    id: z.uuidv7(),
    type: z.union([z.literal(EvalLogicNodeTypeEnum.GROUP), z.literal(EvalLogicNodeTypeEnum.LIMIT)]),
    get children(){
      return z.array(evalLogicNodeSchema)
    }
  }),
  z.object({
    id: z.uuidv7(),
    type: z.literal(EvalLogicNodeTypeEnum.OPERATOR),
    operatorValue: z.enum(EvalLogicNodeOperatorValueEnum),
    get children(){
      return z.array(evalLogicNodeSchema)
    }
  }),
])
