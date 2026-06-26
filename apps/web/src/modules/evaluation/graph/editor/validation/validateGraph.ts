import type { Schemes } from "@/modules/evaluation/graph/editor/types";
import type { NodeEditor } from "rete";
import { findActionsWithInvalidSource } from "./rules/validateActions";
import {
  findNodesOutsideResultIsland,
  findBranchesNotLeadingToResult,
} from "./rules/validateGlobal";
import {
  findCrossScopeConnections,
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
  const graphIssues: ValidationIssue[] = [];

  const context = { graph, nodeIssues, controlIssues, graphIssues };

  findEmptyLimits(context);
  findLimitsWithMultipleIslands(context);

  findOrphanLimitItems(context);
  findCrossScopeConnections(context);
  findLimitsWithMissingRequiredInputs(context);

  findUselessLogicalNodes(context);

  findActionsWithInvalidSource(context);

  findInvalidResultNodeCount(context);

  findNodesOutsideResultIsland(context);
  findBranchesNotLeadingToResult(context);

  const hasNodeErrors = Array.from(nodeIssues.values()).some((issues) =>
    issues.some((issue) => issue.level === "error"),
  );

  const hasControlErrors = Array.from(controlIssues.values()).some(
    (controlIssueMap) =>
      Object.values(controlIssueMap).some((issues) =>
        issues.some((issue) => issue.level === "error"),
      ),
  );

  const hasGraphErrors = graphIssues.some((issue) => issue.level === "error");

  return {
    valid: !hasNodeErrors && !hasControlErrors && !hasGraphErrors,
    nodeIssues,
    controlIssues,
    graphIssues,
  };
}
