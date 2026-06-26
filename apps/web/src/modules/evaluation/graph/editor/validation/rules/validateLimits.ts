import { pushIssue, pushControlIssue } from "@/modules/evaluation/graph/editor/validation/issues";
import { countConnectedComponents } from "@/modules/evaluation/graph/editor/utils/graph";
import { isLimitNode } from "@/modules/evaluation/graph/editor/utils/guards";
import {
  type ValidationContext,
} from "@/modules/evaluation/graph/editor/validation/types";

/**
 * Finds Limit nodes that do not contain any child nodes.
 *
 * Empty Limit nodes have no rules to evaluate and therefore have no effect.
 */
export function findEmptyLimits(context: ValidationContext) {
  const { graph, nodeIssues } = context;

  for (const node of graph.nodes) {
    if (!isLimitNode(node)) continue;
    if (graph.getChildren(node.id).length > 0) continue;

    pushIssue(nodeIssues, node.id, {
      level: "warning",
      message: "Useless Check",
      description: [
        "A check node with no children has no effect and can be removed.",
      ],
    });
  }
}

/**
 * Finds Limit nodes whose children form more than one disconnected island.
 *
 * All nodes inside a Limit node must be connected into a single child graph.
 */
export function findLimitsWithMultipleIslands(context: ValidationContext) {
  const { graph, nodeIssues } = context;

  for (const limitNode of graph.nodes) {
    if (!isLimitNode(limitNode)) continue;

    const children = graph.getChildren(limitNode.id);
    if (children.length <= 1) continue;

    const islandCount = countConnectedComponents(children, graph.connections);
    if (islandCount <= 1) continue;

    pushIssue(nodeIssues, limitNode.id, {
      level: "error",
      message: "Disconnected children",
      description: [
        "All Check items inside a Check must form a single connected component.",
        "Connect all child nodes together or split them into separate Check nodes.",
      ],
    });
  }
}

/**
 * Finds missing required inputs inside Limit nodes.
 *
 * These issues are attached to specific controls so the UI can highlight the
 * invalid input without adding extra content to the node.
 */
export function findLimitsWithMissingRequiredInputs(
  context: ValidationContext,
) {
  const { graph, controlIssues } = context;

  for (const node of graph.nodes) {
    if (!isLimitNode(node)) continue;

    if (!node.controls.name.isValid()) {
      pushControlIssue(controlIssues, node.id, "name", {
        level: "error",
      });
    }

    if (!node.controls.label.isValid()) {
      pushControlIssue(controlIssues, node.id, "label", {
        level: "error",
      });
    }
  }
}
