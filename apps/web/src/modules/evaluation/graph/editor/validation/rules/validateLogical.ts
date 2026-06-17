import { isLogicalOperator } from "@/modules/evaluation/graph/editor/utils/guards";
import {
  pushIssue,
  type ValidationContext,
} from "@/modules/evaluation/graph/editor/validation/types";

/**
 * Finds logical nodes with exactly one input.
 *
 * A logical operator with only one input does not change the result and has no
 * meaningful logical effect.
 */
export function findUselessLogicalNodes(context: ValidationContext) {
  const { graph, nodeIssues } = context;

  for (const node of graph.nodes) {
    if (!isLogicalOperator(node)) continue;
    // FIX(bug): a logical operator with zero inputs silently passes — wired into the Result island (e.g. AND -> Result) it is flagged by no rule at all, yet it cannot evaluate to anything meaningful — fix: also report length === 0 (arguably as an error, since the node is not just useless but unevaluable); why: malformed graphs validate as clean.
    if (graph.getIncoming(node.id).length != 1) continue;

    pushIssue(nodeIssues, node.id, {
      level: "warning",
      // FIX(consistency): 'Operator useless' inverts the word order of the sibling rule's title 'Useless Limit' (validateLimits.ts) — fix: use 'Useless operator'; why: these titles are user-facing and should follow one convention.
      message: "Operator useless",
      description: [
        "Logical operators with only one input do not change the result and can be removed.",
        "Either connect the input directly to the output and remove this node, or add more inputs to create a meaningful logical expression.",
      ],
    });
  }
}
