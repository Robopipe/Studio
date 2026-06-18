// The SSOT cache holds the READ type `EvalTestCaseFull` (limits carry full
// `targetLabel`/`targetParentLabel` objects + timestamps). The editor load path consumes
// the WRITE type `EvalTestCaseFullCreateOrUpdate` (targetLabelId/targetParentLabelId, no
// timestamps). This is the one schema-to-schema mapper bridging the two; enums pass
// through unchanged (no casting).
import type {
  EvalTestCaseFull,
  EvalTestCaseFullCreateOrUpdate,
} from "@repo/schema";

export function toFullCreateOrUpdate(
  full: EvalTestCaseFull,
): EvalTestCaseFullCreateOrUpdate {
  return {
    name: full.name,
    type: full.type,
    severity: full.severity,
    enabled: full.enabled,
    logicNodes: full.logicNodes,
    limits: full.limits.map((limit) => ({
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
}
