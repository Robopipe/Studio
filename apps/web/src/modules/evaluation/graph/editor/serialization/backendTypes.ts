// Editor-internal payload vocabulary.
//
// These string-literal unions are DERIVED from the canonical `@repo/schema` enums
// (via template-literal types), so they can never drift from the backend contract:
// `${EvalSeverityEnum}` evaluates to exactly `'ALERT' | 'WARNING'`, etc. The editor
// works with plain string literals internally; conversion to the nominal `@repo/schema`
// enum types happens at the serialize/deserialize boundary in `schemaAdapters.ts`.
//
// The payload shapes below are structurally identical to the schema's
// `evalTestCaseFullCreateOrUpdateSchema` (POSITION + targetEdge/parentEdge, `enabled`).
import type {
  EvalLimitItemEdgeEnum,
  EvalLimitItemOperatorEnum,
  EvalLimitItemParameterEnum,
  EvalLimitItemQuantifierTypeEnum,
  EvalLimitItemQuantifierUnitEnum,
  EvalLogicNodeOperatorValueEnum,
  EvalSeverityEnum,
  EvalTestCaseTypeEnum,
} from "@repo/schema";

export type EvalSeverity = `${EvalSeverityEnum}`;

export type EvalTestCaseType = `${EvalTestCaseTypeEnum}`;

export type EvalLimitItemParameter = `${EvalLimitItemParameterEnum}`;

export type EvalLimitItemEdge = `${EvalLimitItemEdgeEnum}`;

export type EvalLimitItemOperator = `${EvalLimitItemOperatorEnum}`;

export type EvalLimitItemQuantifierType = `${EvalLimitItemQuantifierTypeEnum}`;

export type EvalLimitItemQuantifierUnit = `${EvalLimitItemQuantifierUnitEnum}`;

export type EvalLogicNodeOperatorValue = `${EvalLogicNodeOperatorValueEnum}`;

export type EvalLimitItemCreateOrUpdatePayload = {
  id: string | null;
  limitFrom: number | null;
  limitTo: number | null;
  parameter: EvalLimitItemParameter;
  operator: EvalLimitItemOperator;
  quantifierType: EvalLimitItemQuantifierType;
  quantifierUnit: EvalLimitItemQuantifierUnit;
  quantifierValue: number;
  targetEdge: EvalLimitItemEdge;
  parentEdge: EvalLimitItemEdge;
};

export type EvalLimitCreateOrUpdatePayload = {
  id: string;
  name: string;
  severity: EvalSeverity | null;
  enabled: boolean;
  targetLabelId: number;
  targetParentLabelId: number | null;
  limitItems: EvalLimitItemCreateOrUpdatePayload[];
};

export type EvalLogicNodePayload =
  | {
      id: string;
      type: "GROUP";
      children: EvalLogicNodePayload[];
    }
  | {
      id: string;
      type: "LIMIT";
    }
  | {
      id: string;
      type: "OPERATOR";
      operatorValue: EvalLogicNodeOperatorValue;
    };

export type EvalTestCaseCreateOrUpdatePayload = {
  id: string;
  name: string;
  type: EvalTestCaseType;
  severity: EvalSeverity | null;
  enabled: boolean;
  limits: EvalLimitCreateOrUpdatePayload[];
  logicNodes: EvalLogicNodePayload[];
};
