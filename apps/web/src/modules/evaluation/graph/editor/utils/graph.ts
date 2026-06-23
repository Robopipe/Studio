import type {
  ConnProps,
  NodeProps,
} from "@/modules/evaluation/graph/editor/types";

export function findConnectedComponents(
  nodeIds: string[],
  connections: Array<{ source: string; target: string }>,
) {
  const allowedIds = new Set(nodeIds);
  const adjacency = new Map<string, Set<string>>();

  const originalIndexByNodeId = new Map<string, number>();

  nodeIds.forEach((nodeId, index) => {
    originalIndexByNodeId.set(nodeId, index);
    adjacency.set(nodeId, new Set());
  });

  for (const connection of connections) {
    if (!allowedIds.has(connection.source)) continue;
    if (!allowedIds.has(connection.target)) continue;

    adjacency.get(connection.source)?.add(connection.target);
    adjacency.get(connection.target)?.add(connection.source);
  }

  const components: string[][] = [];
  const visited = new Set<string>();

  for (const nodeId of nodeIds) {
    if (visited.has(nodeId)) continue;

    const component: string[] = [];
    const stack = [nodeId];

    visited.add(nodeId);

    while (stack.length > 0) {
      const current = stack.pop();
      if (current === undefined) continue;

      component.push(current);

      for (const next of adjacency.get(current) ?? []) {
        if (visited.has(next)) continue;

        visited.add(next);
        stack.push(next);
      }
    }

    component.sort((a, b) => {
      const indexA = originalIndexByNodeId.get(a) ?? Number.MAX_SAFE_INTEGER;
      const indexB = originalIndexByNodeId.get(b) ?? Number.MAX_SAFE_INTEGER;
      return indexA - indexB;
    });

    components.push(component);
  }

  return components.sort((a, b) => {
    const oldestIndexA = getOldestNodeIndex(a, originalIndexByNodeId);
    const oldestIndexB = getOldestNodeIndex(b, originalIndexByNodeId);
    return oldestIndexA - oldestIndexB;
  });
}

function getOldestNodeIndex(
  component: string[],
  originalIndexByNodeId: Map<string, number>,
) {
  return component.reduce((oldestIndex, nodeId) => {
    const index = originalIndexByNodeId.get(nodeId) ?? Number.MAX_SAFE_INTEGER;

    return Math.min(oldestIndex, index);
  }, Number.MAX_SAFE_INTEGER);
}

export function countConnectedComponents(
  nodes: NodeProps[],
  connections: ConnProps[],
) {
  return findConnectedComponents(
    nodes.map((node) => node.id),
    connections,
  ).length;
}
