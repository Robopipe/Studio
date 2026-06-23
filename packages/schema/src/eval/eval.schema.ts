import z from "zod";
import { timestampsSchema } from "../helpers";
import { labelSchema } from "../label";

/**
 * EVAL logic entities
 */

export enum EvalLogicNodeTypeEnum {
  GROUP = "GROUP",
  LIMIT = "LIMIT",
  OPERATOR = "OPERATOR",
}

export enum EvalLogicNodeOperatorValueEnum {
  AND = "AND",
  OR = "OR",
  NOT = "NOT",
}

export const evalLogicNodeSchema = z.union([
  z.object({
    id: z.uuidv7(),
    type: z.literal(EvalLogicNodeTypeEnum.GROUP),
    get children() {
      return z.array(evalLogicNodeSchema);
    },
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
]);

/**
 * EVAL entities
 */

export enum EvalTestCaseTypeEnum {
  CHECK = "CHECK",
  DEFECT = "DEFECT",
}

export enum EvalSeverityEnum {
  ALERT = "ALERT",
  WARNING = "WARNING",
}

export enum EvalLimitItemParameterEnum {
  POSITION = "POSITION", // %
  AREA = "AREA", // %
  COUNT = "COUNT", // pcs
}

export enum EvalLimitItemEdgeEnum {
  LEFT = "LEFT",
  RIGHT = "RIGHT",
  TOP = "TOP",
  BOTTOM = "BOTTOM",
  CENTER = "CENTER",
}

export enum EvalLimitItemOperatorEnum {
  AND = "AND",
  OR = "OR",
}

export enum EvalLimitItemQuantifierTypeEnum {
  MIN = "MIN",
  MAX = "MAX",
  EXACT = "EXACT",
}

export enum EvalLimitItemQuantifierUnitEnum {
  PERCENT = "PERCENT",
  PCS = "PCS",
}

function validateEdgePair(
  data: { parameter: string; targetEdge: string; parentEdge: string },
  ctx: z.RefinementCtx,
) {
  if (data.parameter !== EvalLimitItemParameterEnum.POSITION) return;
  const horizontal = new Set<string>([EvalLimitItemEdgeEnum.LEFT, EvalLimitItemEdgeEnum.RIGHT]);
  const vertical = new Set<string>([EvalLimitItemEdgeEnum.TOP, EvalLimitItemEdgeEnum.BOTTOM]);
  const targetIsH = horizontal.has(data.targetEdge);
  const targetIsV = vertical.has(data.targetEdge);
  const parentIsH = horizontal.has(data.parentEdge);
  const parentIsV = vertical.has(data.parentEdge);
  if ((targetIsH && parentIsV) || (targetIsV && parentIsH)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Target edge and parent edge must be on the same axis, or one must be CENTER",
      path: ["parentEdge"],
    });
  }
}

/* Eval limit item */
const evalLimitItemBaseSchema = z.object({
  id: z.uuidv7(),
  limitFrom: z.number().nullable(),
  limitTo: z.number().nullable(),
  parameter: z.enum(EvalLimitItemParameterEnum),
  operator: z.enum(EvalLimitItemOperatorEnum), // Operator "after" the limit item, default to AND
  quantifierType: z.enum(EvalLimitItemQuantifierTypeEnum),
  quantifierUnit: z.enum(EvalLimitItemQuantifierUnitEnum),
  quantifierValue: z.number(),
  targetEdge: z.enum(EvalLimitItemEdgeEnum),
  parentEdge: z.enum(EvalLimitItemEdgeEnum),
  createdAt: timestampsSchema.createdAt,
  updatedAt: timestampsSchema.updatedAt,
});

export const evalLimitItemSchema = evalLimitItemBaseSchema.superRefine(validateEdgePair);
// .refine((limitItem) => limitItem.limitFrom !== null || limitItem.limitTo !== null, {
//   message: "At least one of limitFrom or limitTo must be provided"
// })

/* Eval limit */
export const evalLimitSchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  severity: z.enum(EvalSeverityEnum).nullable(),
  enabled: z.boolean(),
  targetLabel: labelSchema,
  targetParentLabel: labelSchema.nullable(),
  createdAt: timestampsSchema.createdAt,
  updatedAt: timestampsSchema.updatedAt,
});

/* Eval limit detail -> With limit items */
export const evalLimitDetailSchema = evalLimitSchema.extend({
  limitItems: z.array(evalLimitItemSchema),
});

/* Eval test case -> With limits */
export const evalTestCaseSchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  type: z.enum(EvalTestCaseTypeEnum),
  severity: z.enum(EvalSeverityEnum).nullable(),
  enabled: z.boolean(),
  limits: z.array(evalLimitSchema), // Always required
  createdAt: timestampsSchema.createdAt,
  updatedAt: timestampsSchema.updatedAt,
});

export const evalTestCaseDetailSchema = evalTestCaseSchema.extend({
  logicNodes: evalLogicNodeSchema.array(), // [] by default
});

export const evalThresholdSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  value: z.number(),
  createdAt: timestampsSchema.createdAt,
  updatedAt: timestampsSchema.updatedAt,
});

export const evalTestCaseThresholdSchema = evalTestCaseSchema
  .pick({
    id: true,
    name: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    thresholds: evalThresholdSchema.array(),
  });

/**
 * API schemas
 */

// For creating and updating test cases. BE ignores logic nodes if not present, otherwise updates
export const evalTestCaseCreateOrUpdateSchema = evalTestCaseDetailSchema
  .pick({
    name: true,
    type: true,
    severity: true,
    enabled: true,
  })
  .extend({
    logicNodes: evalLogicNodeSchema.array().optional(),
  });

// For creating and updating limits. BE does the diff check for limit items,
// existing/updated limit items will be sent with their IDs, new limit items with ID null
// BE deletes limit items which were not sent
export const evalLimitCreateOrUpdateSchema = evalLimitSchema
  .pick({
    name: true,
    severity: true,
    enabled: true,
  })
  .extend({
    targetLabelId: z.number(),
    targetParentLabelId: z.number().nullable(),
    limitItems: evalLimitItemBaseSchema
      .pick({
        limitFrom: true,
        limitTo: true,
        parameter: true,
        operator: true,
        quantifierType: true,
        quantifierUnit: true,
        quantifierValue: true,
        targetEdge: true,
        parentEdge: true,
      })
      .extend({
        id: z.uuidv7().nullable(), // Added items will have ID null
      })
      .superRefine(validateEdgePair)
      .array(),
  });

export const evalTestCaseFullCreateOrUpdateSchema = evalTestCaseDetailSchema.pick({
  name: true,
  type: true,
  severity: true,
  enabled: true,
}).extend({
  logicNodes: evalLogicNodeSchema.array().optional(),
  limits: evalLimitCreateOrUpdateSchema.extend({id: z.uuidv7().nullish()}).array().optional()
})

export const evalThresholdCreateOrUpdateSchema = evalThresholdSchema.pick({
  name: true,
  color: true,
  value: true,
});

export const evalThresholdsResponseSchema = z.object({
  testCases: z.array(evalTestCaseThresholdSchema),
  master: z.array(evalThresholdSchema),
});
