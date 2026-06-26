import { pushIssue } from "@/modules/evaluation/graph/editor/validation/issues";
import {
  isActionNode,
  isLimitNode,
  isResultNode,
} from "@/modules/evaluation/graph/editor/utils/guards";
import {
  type ValidationContext,
} from "@/modules/evaluation/graph/editor/validation/types";

/**
 * Finds action nodes connected from unsupported sources.
 *
 * Action nodes can only be connected directly from a Limit node or from the
 * Result node.
 */
export function findActionsWithInvalidSource(context: ValidationContext) {
  const { graph, nodeIssues } = context;
  for (const node of graph.nodes) {
    if (!isActionNode(node)) continue;
    const incomingConnections = graph.getIncoming(node.id);

    for (const connection of incomingConnections) {
      const sourceNode = graph.getNode(connection.source);
      if (!sourceNode) continue;
      if (isLimitNode(sourceNode) || isResultNode(sourceNode)) continue;

      pushIssue(nodeIssues, node.id, {
        level: "error",
        message: "Invalid action placement",
        description: [
          "The previous node does not support an action.",
          "Actions can only be connected directly to a Check node or to the Result node.",
        ],
      });
      break;
    }
  }
}
