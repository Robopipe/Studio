import { isResultNode } from "@/modules/evaluation/graph/editor/utils/guards";
import {
  pushIssue,
  type ValidationContext,
} from "@/modules/evaluation/graph/editor/validation/types";

/**
 * Finds graphs that do not contain exactly one Result node.
 *
 * The Result node is the required terminal node of the graph and acts as the
 * anchor for the main graph island.
 */
export function findInvalidResultNodeCount(context: ValidationContext) {
  const { graph, nodeIssues } = context;
  const resultNodes = graph.nodes.filter(isResultNode);
  // FIX(bug): the doc comment promises 'exactly one' Result node, but the zero-Result case silently passes — the loop below has nothing to iterate, so a graph with no Result node (e.g. an empty graph) returns valid: true from validateGraph — fix: handle resultNodes.length === 0 explicitly (requires a graph-level issue slot or forcing valid=false in the result); why: validation green-lights graphs missing their documented required terminal node.
  if (resultNodes.length === 1) return;

  for (const node of resultNodes) {
    pushIssue(nodeIssues, node.id, {
      level: "error",
      message: "Multiple Result nodes",
      description: ["The graph can contain only one Result node."],
    });
  }
}
