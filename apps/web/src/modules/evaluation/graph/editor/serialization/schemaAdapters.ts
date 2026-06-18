// Boundary between the editor's string-literal payloads and the nominal `@repo/schema`
// enum types. The editor payload is structurally identical to
// `evalTestCaseFullCreateOrUpdateSchema`, so these adapters are a pure 1:1 value mapping
// (string literal <-> enum member). This is the only module that bridges the two type
// systems — everything else in the editor stays on plain string literals.
import {
  EvalLimitItemEdgeEnum,
  EvalLimitItemOperatorEnum,
  EvalLimitItemParameterEnum,
  EvalLimitItemQuantifierTypeEnum,
  EvalLimitItemQuantifierUnitEnum,
  EvalLogicNodeOperatorValueEnum,
  EvalLogicNodeTypeEnum,
  EvalSeverityEnum,
  EvalTestCaseTypeEnum,
  type EvalLimitCreateOrUpdate,
  type EvalLogicNode,
  type EvalTestCaseFull,
  type EvalTestCaseFullCreateOrUpdate,
} from "@repo/schema";
import type {
  EvalLimitCreateOrUpdatePayload,
  EvalLimitItemCreateOrUpdatePayload,
  EvalLogicNodePayload,
  EvalTestCaseCreateOrUpdatePayload,
} from "./backendTypes";

/* ------------------------------ editor -> schema ------------------------------ */

export function toSchemaTestCase(
  payload: EvalTestCaseCreateOrUpdatePayload,
): EvalTestCaseFullCreateOrUpdate {
  return {
    name: payload.name,
    type: EvalTestCaseTypeEnum[payload.type],
    severity:
      payload.severity === null ? null : EvalSeverityEnum[payload.severity],
    enabled: payload.enabled,
    limits: payload.limits.map(toSchemaLimit),
    logicNodes: payload.logicNodes.map(toSchemaLogicNode),
  };
}

type SchemaFullLimit = NonNullable<
  EvalTestCaseFullCreateOrUpdate["limits"]
>[number];

function toSchemaLimit(limit: EvalLimitCreateOrUpdatePayload): SchemaFullLimit {
  return {
    id: limit.id,
    name: limit.name,
    severity: limit.severity === null ? null : EvalSeverityEnum[limit.severity],
    enabled: limit.enabled,
    targetLabelId: limit.targetLabelId,
    targetParentLabelId: limit.targetParentLabelId,
    limitItems: limit.limitItems.map(toSchemaLimitItem),
  };
}

function toSchemaLimitItem(item: EvalLimitItemCreateOrUpdatePayload) {
  return {
    id: item.id,
    limitFrom: item.limitFrom,
    limitTo: item.limitTo,
    parameter: EvalLimitItemParameterEnum[item.parameter],
    operator: EvalLimitItemOperatorEnum[item.operator],
    quantifierType: EvalLimitItemQuantifierTypeEnum[item.quantifierType],
    quantifierUnit: EvalLimitItemQuantifierUnitEnum[item.quantifierUnit],
    quantifierValue: item.quantifierValue,
    targetEdge: EvalLimitItemEdgeEnum[item.targetEdge],
    parentEdge: EvalLimitItemEdgeEnum[item.parentEdge],
  };
}

function toSchemaLogicNode(node: EvalLogicNodePayload): EvalLogicNode {
  switch (node.type) {
    case "GROUP":
      return {
        id: node.id,
        type: EvalLogicNodeTypeEnum.GROUP,
        children: node.children.map(toSchemaLogicNode),
      };
    case "LIMIT":
      return { id: node.id, type: EvalLogicNodeTypeEnum.LIMIT };
    case "OPERATOR":
      return {
        id: node.id,
        type: EvalLogicNodeTypeEnum.OPERATOR,
        operatorValue: EvalLogicNodeOperatorValueEnum[node.operatorValue],
      };
  }
}

/* ------------------------------ schema -> editor ------------------------------ */

export function fromSchemaTestCase(
  testCase: EvalTestCaseFullCreateOrUpdate,
  options: { id?: string } = {},
): EvalTestCaseCreateOrUpdatePayload {
  return {
    id: options.id ?? "",
    name: testCase.name,
    type: `${testCase.type}`,
    severity: testCase.severity === null ? null : `${testCase.severity}`,
    enabled: testCase.enabled,
    limits: (testCase.limits ?? []).map(fromSchemaLimit),
    logicNodes: (testCase.logicNodes ?? []).map(fromSchemaLogicNode),
  };
}

/**
 * Reshapes a full test case (the SSOT shape: meta + logicNodes + limits WITH their
 * items) into the editor payload, reusing `fromSchemaTestCase` so the literal<->enum
 * mapping stays in one place.
 */
export function fromFullTestCase(
  testCase: EvalTestCaseFull,
): EvalTestCaseCreateOrUpdatePayload {
  const full: EvalTestCaseFullCreateOrUpdate = {
    name: testCase.name,
    type: testCase.type,
    severity: testCase.severity,
    enabled: testCase.enabled,
    logicNodes: testCase.logicNodes,
    limits: testCase.limits.map((limit) => ({
      id: limit.id,
      name: limit.name,
      severity: limit.severity,
      enabled: limit.enabled,
      targetLabelId: limit.targetLabel.id,
      targetParentLabelId: limit.targetParentLabel?.id ?? null,
      limitItems: limit.limitItems.map((item) => ({
        id: item.id,
        limitFrom: item.limitFrom,
        limitTo: item.limitTo,
        parameter: item.parameter,
        operator: item.operator,
        quantifierType: item.quantifierType,
        quantifierUnit: item.quantifierUnit,
        quantifierValue: item.quantifierValue,
        targetEdge: item.targetEdge,
        parentEdge: item.parentEdge,
      })),
    })),
  };

  return fromSchemaTestCase(full, { id: testCase.id });
}

function fromSchemaLimit(
  limit: SchemaFullLimit,
): EvalLimitCreateOrUpdatePayload {
  return {
    id: limit.id ?? "",
    name: limit.name,
    severity: limit.severity === null ? null : `${limit.severity}`,
    enabled: limit.enabled,
    targetLabelId: limit.targetLabelId,
    targetParentLabelId: limit.targetParentLabelId,
    limitItems: limit.limitItems.map(fromSchemaLimitItem),
  };
}

function fromSchemaLimitItem(
  item: EvalLimitCreateOrUpdate["limitItems"][number],
): EvalLimitItemCreateOrUpdatePayload {
  return {
    id: item.id,
    limitFrom: item.limitFrom,
    limitTo: item.limitTo,
    parameter: `${item.parameter}`,
    operator: `${item.operator}`,
    quantifierType: `${item.quantifierType}`,
    quantifierUnit: `${item.quantifierUnit}`,
    quantifierValue: item.quantifierValue,
    targetEdge: `${item.targetEdge}`,
    parentEdge: `${item.parentEdge}`,
  };
}

function fromSchemaLogicNode(node: EvalLogicNode): EvalLogicNodePayload {
  switch (node.type) {
    case EvalLogicNodeTypeEnum.GROUP:
      // Zod's recursive `get children()` widens the element type; it is an EvalLogicNode[].
      return {
        id: node.id,
        type: "GROUP",
        children: (node.children as EvalLogicNode[]).map(fromSchemaLogicNode),
      };
    case EvalLogicNodeTypeEnum.LIMIT:
      return { id: node.id, type: "LIMIT" };
    case EvalLogicNodeTypeEnum.OPERATOR:
      return {
        id: node.id,
        type: "OPERATOR",
        operatorValue: `${node.operatorValue}`,
      };
  }
}
