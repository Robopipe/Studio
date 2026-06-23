import { pushIssue } from "@/modules/evaluation/graph/editor/validation/issues";
import { isResultNode } from "@/modules/evaluation/graph/editor/utils/guards";
import {
  type ValidationContext,
} from "@/modules/evaluation/graph/editor/validation/types";

/**
 * Finds graphs that do not contain exactly one Result node.
 *
 * The Result node is the required terminal node of the graph and acts as the
 * anchor for the main graph island.
 */
export function findInvalidResultNodeCount(context: ValidationContext) {
  const { graph, nodeIssues, graphIssues } = context;
  const resultNodes = graph.nodes.filter(isResultNode);

  if (resultNodes.length === 1) return;

  if (resultNodes.length === 0) {
    graphIssues.push({
      level: "error",
      message: "Missing Result node",
      description: ["The graph must contain exactly one Result node."],
    });
    return;
  }

  for (const node of resultNodes) {
    pushIssue(nodeIssues, node.id, {
      level: "error",
      message: "Multiple Result nodes",
      description: ["The graph can contain only one Result node."],
    });
  }
}
