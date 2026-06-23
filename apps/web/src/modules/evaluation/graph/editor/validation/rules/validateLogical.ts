import { pushIssue } from "@/modules/evaluation/graph/editor/validation/issues";
import { isLogicalOperator } from "@/modules/evaluation/graph/editor/utils/guards";
import {
  type ValidationContext,
} from "@/modules/evaluation/graph/editor/validation/types";

/**
 * Finds logical nodes that cannot form a meaningful expression: zero inputs
 * (unevaluable, reported as an error) or exactly one input (a no-op that does
 * not change the result, reported as a warning).
 */
export function findUselessLogicalNodes(context: ValidationContext) {
  const { graph, nodeIssues } = context;

  for (const node of graph.nodes) {
    if (!isLogicalOperator(node)) continue;

    const inputCount = graph.getIncoming(node.id).length;

    if (inputCount === 0) {
      pushIssue(nodeIssues, node.id, {
        level: "error",
        message: "Operator has no inputs",
        description: [
          "A logical operator needs at least two inputs to combine.",
          "Connect inputs to this operator or remove it.",
        ],
      });
      continue;
    }

    if (inputCount !== 1) continue;

    pushIssue(nodeIssues, node.id, {
      level: "warning",
      message: "Useless operator",
      description: [
        "Logical operators with only one input do not change the result and can be removed.",
        "Either connect the input directly to the output and remove this node, or add more inputs to create a meaningful logical expression.",
      ],
    });
  }
}
