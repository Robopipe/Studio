import type { Schemes } from "@/modules/evaluation/graph/editor/types";
import type { NodeEditor } from "rete";
import { findActionsWithInvalidSource } from "./rules/validateActions";
import {
  findNodesOutsideResultIsland,
  findNodesWithMultipleGraphOutputs,
} from "./rules/validateGlobal";
import {
  findLimitItemCrossScopeConnections,
  findOrphanLimitItems,
} from "./rules/validateLimitItems";
import {
  findEmptyLimits,
  findLimitsWithMissingRequiredInputs,
  findLimitsWithMultipleIslands,
} from "./rules/validateLimits";
import { findUselessLogicalNodes } from "./rules/validateLogical";
import { findInvalidResultNodeCount } from "./rules/validateResult";
import type { ControlIssues, ValidationIssue, ValidationResult } from "./types";
import { ValidationGraph } from "./validationGraph";

export function validateGraph(editor: NodeEditor<Schemes>): ValidationResult {
  const graph = new ValidationGraph(editor);
  const nodeIssues = new Map<string, ValidationIssue[]>();
  const controlIssues = new Map<string, ControlIssues>();

  const context = { graph, nodeIssues, controlIssues };

  findEmptyLimits(context);
  findLimitsWithMultipleIslands(context);

  findOrphanLimitItems(context);
  findLimitItemCrossScopeConnections(context);
  findLimitsWithMissingRequiredInputs(context);

  findUselessLogicalNodes(context);

  findActionsWithInvalidSource(context);

  findInvalidResultNodeCount(context);

  findNodesOutsideResultIsland(context);
  findNodesWithMultipleGraphOutputs(context);

  const hasNodeErrors = Array.from(nodeIssues.values()).some((issues) =>
    issues.some((issue) => issue.level === "error"),
  );

  const hasControlErrors = Array.from(controlIssues.values()).some(
    (controlIssueMap) =>
      Object.values(controlIssueMap).some((issues) =>
        issues.some((issue) => issue.level === "error"),
      ),
  );

  return {
    valid: !hasNodeErrors && !hasControlErrors,
    nodeIssues,
    controlIssues,
  };
}
