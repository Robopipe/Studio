import type { NodeProps } from "@/modules/evaluation/graph/editor/types";
import { findConnectedComponents } from "@/modules/evaluation/graph/editor/utils/graph";
import {
  isActionNode,
  isLimitItemNode,
  isLimitNode,
  isLogicalOperator,
  isResultNode,
} from "@/modules/evaluation/graph/editor/utils/guards";
import {
  pushIssue,
  type ValidationContext,
} from "@/modules/evaluation/graph/editor/validation/types";

/**
 * Finds graph nodes that are not connected to any Result node island.
 *
 * Every graph node except LimitItem nodes must belong to a connected component
 * that contains at least one Result node.
 *
 * LimitItem nodes are ignored because they are scoped inside Limit nodes and
 * validated separately as children of their parent Limit.
 */
export function findNodesOutsideResultIsland(context: ValidationContext) {
  const { graph, nodeIssues } = context;

  const graphNodes = graph.nodes.filter((node) => !isLimitItemNode(node));

  if (graphNodes.length === 0) return;

  // FIX(duplication): this whole island-with-Result computation duplicates getResultIslandNodeIds() defined below, and runs findConnectedComponents a second time on every validation pass — fix: replace this block with `const nodeIdsWithResult = getResultIslandNodeIds(context);`; why: two copies of the same traversal will diverge over time and double the work on every editor change.
  const nodeIds = graphNodes.map((node) => node.id);
  const nodeIdsWithResult = new Set<string>();

  const islands = findConnectedComponents(nodeIds, graph.connections);

  for (const island of islands) {
    const islandHasResult = island.some((nodeId) => {
      const node = graph.getNode(nodeId);
      return node && isResultNode(node);
    });

    if (!islandHasResult) continue;

    for (const nodeId of island) {
      nodeIdsWithResult.add(nodeId);
    }
  }

  for (const node of graphNodes) {
    if (nodeIdsWithResult.has(node.id)) continue;

    pushIssue(nodeIssues, node.id, {
      level: "error",
      message: "Disconnected node",
      description: [
        "This node is not connected to a Result node.",
        "All graph nodes except Limit items must be connected to an island that contains a Result node.",
      ],
    });
  }
}

/**
 * Finds graph branches that do not lead to a Result node.
 *
 * This only applies inside islands that contain a Result node. Islands without
 * a Result node are ignored here because they are already reported by the
 * disconnected-node validation.
 *
 * When a Limit or logical node has multiple non-action outputs, every branch
 * must eventually lead to a Result node. Branch targets that do not lead to a
 * Result node are marked as invalid.
 */
export function findBranchesNotLeadingToResult(context: ValidationContext) {
  const { graph, nodeIssues } = context;

  const resultIslandNodeIds = getResultIslandNodeIds(context);
  const reportedNodeIds = new Set<string>();

  for (const node of graph.nodes) {
    if (!resultIslandNodeIds.has(node.id)) continue;
    if (!canProduceGraphOutput(node)) continue;

    const graphOutputConnections = getGraphOutputConnections(context, node.id);

    if (graphOutputConnections.length <= 1) continue;

    for (const connection of graphOutputConnections) {
      if (reportedNodeIds.has(connection.target)) continue;
      if (doesPathLeadToResult(context, connection.target)) continue;

      reportedNodeIds.add(connection.target);

      pushIssue(nodeIssues, connection.target, {
        level: "error",
        message: "Branch does not lead to Result",
        description: [
          "This branch is created from a node with multiple graph outputs.",
          "Every branch in a Result island must eventually connect to a Result node.",
        ],
      });
    }
  }
}

function canProduceGraphOutput(node: NodeProps) {
  // FIX(dead-code): the three early returns are unreachable in effect — the last line already returns true only for Limit/Logical nodes, and a node can never be both Limit/Logical and LimitItem/Action/Result (guards are disjoint instanceof checks) — fix: reduce the body to `return isLimitNode(node) || isLogicalOperator(node);`; why: redundant guards suggest node categories can overlap and obscure the actual rule.
  if (isLimitItemNode(node)) return false;
  if (isActionNode(node)) return false;
  if (isResultNode(node)) return false;

  return isLimitNode(node) || isLogicalOperator(node);
}

function getGraphOutputConnections(context: ValidationContext, nodeId: string) {
  const { graph } = context;

  return graph.getOutgoing(nodeId).filter((connection) => {
    const targetNode = graph.getNode(connection.target);

    if (!targetNode) return false;
    if (isActionNode(targetNode)) return false;
    if (isLimitItemNode(targetNode)) return false;

    return true;
  });
}

function getResultIslandNodeIds(context: ValidationContext) {
  const { graph } = context;

  const graphNodes = graph.nodes.filter((node) => !isLimitItemNode(node));
  const nodeIds = graphNodes.map((node) => node.id);
  const islands = findConnectedComponents(nodeIds, graph.connections);

  const resultIslandNodeIds = new Set<string>();

  for (const island of islands) {
    const islandHasResult = island.some((nodeId) => {
      const node = graph.getNode(nodeId);
      return node && isResultNode(node);
    });

    if (!islandHasResult) continue;

    for (const nodeId of island) {
      resultIslandNodeIds.add(nodeId);
    }
  }

  return resultIslandNodeIds;
}

function doesPathLeadToResult(context: ValidationContext, startNodeId: string) {
  const { graph } = context;

  const visited = new Set<string>();
  const stack = [startNodeId];

  while (stack.length > 0) {
    const currentNodeId = stack.pop();

    if (!currentNodeId) continue;
    if (visited.has(currentNodeId)) continue;

    visited.add(currentNodeId);

    const currentNode = graph.getNode(currentNodeId);

    if (!currentNode) continue;
    if (isResultNode(currentNode)) return true;

    const outgoingConnections = getGraphOutputConnections(
      context,
      currentNodeId,
    );

    for (const connection of outgoingConnections) {
      if (visited.has(connection.target)) continue;

      stack.push(connection.target);
    }
  }

  return false;
}
