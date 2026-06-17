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

      // FIX(perf): sorting neighbours before pushing onto the DFS stack has no effect on the result — component membership is order-independent and each component is re-sorted by original index below anyway — fix: iterate adjacency.get(current) directly; why: O(E log E) of wasted work and it implies traversal order matters when it does not.
      const neighbours = [...(adjacency.get(current) ?? [])].sort((a, b) => {
        const indexA = originalIndexByNodeId.get(a) ?? Number.MAX_SAFE_INTEGER;
        const indexB = originalIndexByNodeId.get(b) ?? Number.MAX_SAFE_INTEGER;
        return indexA - indexB;
      });

      for (const next of neighbours) {
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

// FIX(duplication): re-implements the adjacency build + undirected traversal of findConnectedComponents above — fix: return findConnectedComponents(nodes.map((n) => n.id), connections).length (or extract one shared traversal); why: two hand-written copies of the same algorithm drift independently and double the test/maintenance surface.
export function countConnectedComponents(
  nodes: NodeProps[],
  connections: ConnProps[],
) {
  if (nodes.length === 0) return 0;

  const nodeIds = new Set(nodes.map((node) => node.id));
  const adjacency = new Map<string, Set<string>>();

  for (const node of nodes) {
    adjacency.set(node.id, new Set());
  }

  for (const connection of connections) {
    if (!nodeIds.has(connection.source)) continue;
    if (!nodeIds.has(connection.target)) continue;

    adjacency.get(connection.source)?.add(connection.target);
    adjacency.get(connection.target)?.add(connection.source);
  }

  let count = 0;
  const visited = new Set<string>();

  for (const node of nodes) {
    if (visited.has(node.id)) continue;

    count += 1;
    const stack = [node.id];
    visited.add(node.id);

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) continue;

      for (const next of adjacency.get(current) ?? []) {
        if (visited.has(next)) continue;
        visited.add(next);
        stack.push(next);
      }
    }
  }

  return count;
}
