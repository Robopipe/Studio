import { isLimitItemNode } from "@/modules/evaluation/graph/editor/utils/guards";
import {
  pushIssue,
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
      message: "Orphan Limit item",
      description: [
        "Limit item nodes must be placed inside a limit node",
        "Long press to enter the scope mode and move this node inside a limit node.",
      ],
    });
  }
}

/**
 * Finds connections that cross parent scope boundaries.
 *
 * Connected nodes must either share the same parent or both be root-level nodes.
 */
// FIX(naming): the name (and host file) says 'LimitItem' but the rule iterates ALL connections and fires for any cross-scope pair — there is no isLimitItemNode check — fix: either rename to findCrossScopeConnections and move it next to the other graph-wide rules in validateGlobal.ts, or actually restrict it to limit-item connections; why: the name misleads readers about the rule's scope and about where graph-wide checks live.
export function findLimitItemCrossScopeConnections(context: ValidationContext) {
  const { graph, nodeIssues } = context;

  for (const connection of graph.connections) {
    const sourceNode = graph.getNode(connection.source);
    const targetNode = graph.getNode(connection.target);

    if (!sourceNode || !targetNode) continue;
    if (sourceNode.parent === targetNode.parent) continue;

    pushIssue(nodeIssues, targetNode.id, {
      level: "error",
      message: "Out of bounds connection",
      description: [
        "All connected Limit items must be placed inside the same parent limit node.",
      ],
    });
  }
}
