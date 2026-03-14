import z from "zod";
import { timestampsSchema } from "../helpers";
import { labelSchema } from "../label";

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
    type: z.literal(EvalLogicNodeTypeEnum.GROUP),
    get children(){
      return z.array(evalLogicNodeSchema)
    }
  }),
  z.object({
    id: z.uuidv7(),
    type: z.literal(EvalLogicNodeTypeEnum.LIMIT),
  }),
  z.object({
    id: z.uuidv7(),
    type: z.literal(EvalLogicNodeTypeEnum.OPERATOR),
    operatorValue: z.enum(EvalLogicNodeOperatorValueEnum),
  }),
])


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
  operator: z.enum(EvalLimitItemOperatorEnum), // Operator "after" the limit item, default to AND
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

export const evalTestCaseDetailSchema = evalTestCaseSchema.extend({
  logicNodes: evalLogicNodeSchema.array(), // [] by default
})


/**
 * API schemas
 */

 // For creating and updating test cases. BE ignores logic nodes if not present, otherwise updates
 export const evalTestCaseCreateOrUpdateSchema = evalTestCaseDetailSchema.pick({
   name: true,
   type: true,
   severity: true,
 }).extend({
   logicNodes: evalLogicNodeSchema.array().optional()
 })


// For creating and updating limits. BE does the diff check for limit items,
// existing/updated limit items will be sent with their IDs, new limit items with ID null
// BE deletes limit items which were not sent
 export const evalLimitCreateOrUpdateSchema = evalLimitSchema.pick({
   name: true,
 }).extend({
   targetLabelId: z.number(),
   targetParentLabelId: z.number().nullable(),
   limitItems: evalLimitItemSchema.pick({
     limitFrom: true,
     limitTo: true,
     parameter: true,
     operator: true
   })
   .extend({
     id: z.uuidv7().nullable() // Added items will have ID null
   })
   .array()
 })
