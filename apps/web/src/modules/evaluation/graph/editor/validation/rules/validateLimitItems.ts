import { pushIssue } from "@/modules/evaluation/graph/editor/validation/issues";
import { isLimitItemNode } from "@/modules/evaluation/graph/editor/utils/guards";
import {
  type ValidationContext,
} from "@/modules/evaluation/graph/editor/validation/types";

/**
 * Finds LimitItem nodes that are placed on the root level.
 *
 * LimitItems must always be children of a Limit node.
 */
export function findOrphanLimitItems(context: ValidationContext) {
  const { graph, nodeIssues } = context;

  for (const node of graph.nodes) {
    if (!isLimitItemNode(node)) continue;
    if (node.parent) continue;

    pushIssue(nodeIssues, node.id, {
      level: "error",
      message: "Orphan Check item",
      description: [
        "Check item nodes must be placed inside a check node",
        "Long press to enter the scope mode and move this node inside a check node.",
      ],
    });
  }
}

/**
 * Finds connections that cross parent scope boundaries.
 *
 * Connected nodes must either share the same parent or both be root-level nodes.
 */
export function findCrossScopeConnections(context: ValidationContext) {
  const { graph, nodeIssues } = context;

  for (const connection of graph.connections) {
    const sourceNode = graph.getNode(connection.source);
    const targetNode = graph.getNode(connection.target);

    if (!sourceNode || !targetNode) continue;
    if (graph.haveSameScope(sourceNode, targetNode)) continue;

    pushIssue(nodeIssues, targetNode.id, {
      level: "error",
      message: "Out of bounds connection",
      description: [
        "All connected Check items must be placed inside the same parent check node.",
      ],
    });
  }
}
