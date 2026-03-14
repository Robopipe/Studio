import {
  EvalLogicNode,
  EvalLogicNodeOperatorValueEnum,
  EvalLogicNodeTypeEnum,
} from "@repo/schema";

export type LimitNode = Extract<EvalLogicNode, { type: EvalLogicNodeTypeEnum.LIMIT }>;
export type OperatorNode = Extract<EvalLogicNode, { type: EvalLogicNodeTypeEnum.OPERATOR }>;
export type GroupNode = Extract<EvalLogicNode, { type: EvalLogicNodeTypeEnum.GROUP }>;

export type ProcessedItem = {
  connector: OperatorNode | null; // AND or OR — appears before the item
  not: OperatorNode | null;       // NOT — appears right before the item (after connector)
  item: LimitNode | GroupNode;
};

export function isLimitNode(node: EvalLogicNode): node is LimitNode {
  return node.type === EvalLogicNodeTypeEnum.LIMIT;
}

export function isOperatorNode(node: EvalLogicNode): node is OperatorNode {
  return node.type === EvalLogicNodeTypeEnum.OPERATOR;
}

export function isGroupNode(node: EvalLogicNode): node is GroupNode {
  return node.type === EvalLogicNodeTypeEnum.GROUP;
}

// Zod v4 recursive type inference leaks Record<string,unknown> into GroupNode.children.
// Use this everywhere to avoid widespread ts-ignore.
function children(node: GroupNode): EvalLogicNode[] {
  return node.children as EvalLogicNode[];
}

function makeId(): string {
  return crypto.randomUUID();
}

export function makeOperatorNode(value: EvalLogicNodeOperatorValueEnum): OperatorNode {
  return { id: makeId(), type: EvalLogicNodeTypeEnum.OPERATOR, operatorValue: value };
}

export function makeLimitNode(limitId: string): LimitNode {
  return { id: makeId(), type: EvalLogicNodeTypeEnum.LIMIT, limitId };
}

export function makeGroupNode(ch: EvalLogicNode[], id?: string): GroupNode {
  return { id: id ?? makeId(), type: EvalLogicNodeTypeEnum.GROUP, children: ch as GroupNode["children"] };
}

export function getAllLimitIds(nodes: EvalLogicNode[]): Set<string> {
  const ids = new Set<string>();
  const traverse = (arr: EvalLogicNode[]) => {
    for (const node of arr) {
      if (isLimitNode(node)) ids.add(node.id);
      if (isGroupNode(node)) traverse(children(node));
    }
  };
  traverse(nodes);
  return ids;
}

/**
 * Parse a flat array of nodes into ProcessedItems for rendering.
 * Operators before an item are attached to it as connector (AND/OR) or not (NOT).
 * Array order: [OPERATOR(AND)?, OPERATOR(NOT)?, LIMIT|GROUP, ...]
 */
export function processNodes(nodes: EvalLogicNode[]): ProcessedItem[] {
  const result: ProcessedItem[] = [];
  let pendingConnector: OperatorNode | null = null;
  let pendingNot: OperatorNode | null = null;

  for (const node of nodes) {
    if (isOperatorNode(node)) {
      if (node.operatorValue === EvalLogicNodeOperatorValueEnum.NOT) {
        pendingNot = node;
      } else {
        pendingConnector = node;
      }
    } else {
      result.push({
        connector: pendingConnector,
        not: pendingNot,
        item: node as LimitNode | GroupNode,
      });
      pendingConnector = null;
      pendingNot = null;
    }
  }
  return result;
}

/**
 * Get the node id to use as the "insert before" reference for a gap before this item.
 * The insertion point is at the first node belonging to this item (connector > not > item).
 */
export function getInsertBeforeId(pi: ProcessedItem): string {
  return pi.connector?.id ?? pi.not?.id ?? pi.item.id;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function appendLimitToLevel(
  nodes: EvalLogicNode[],
  limitId: string,
  groupId: string | null,
): EvalLogicNode[] {
  if (groupId === null) {
    const limitNode = makeLimitNode(limitId);
    if (nodes.length === 0) return [limitNode];
    return [...nodes, makeOperatorNode(EvalLogicNodeOperatorValueEnum.AND), limitNode];
  }
  return nodes.map((node) => {
    if (isGroupNode(node) && node.id === groupId) {
      const limitNode = makeLimitNode(limitId);
      const ch = children(node);
      const newChildren =
        ch.length === 0
          ? [limitNode]
          : [...ch, makeOperatorNode(EvalLogicNodeOperatorValueEnum.AND), limitNode];
      return makeGroupNode(newChildren, node.id);
    }
    if (isGroupNode(node)) {
      return makeGroupNode(appendLimitToLevel(children(node), limitId, groupId), node.id);
    }
    return node;
  });
}

export function prependLimitToLevel(
  nodes: EvalLogicNode[],
  limitId: string,
  groupId: string | null,
): EvalLogicNode[] {
  if (groupId === null) {
    const limitNode = makeLimitNode(limitId);
    if (nodes.length === 0) return [limitNode];
    return [limitNode, makeOperatorNode(EvalLogicNodeOperatorValueEnum.AND), ...nodes];
  }
  return nodes.map((node) => {
    if (isGroupNode(node) && node.id === groupId) {
      const limitNode = makeLimitNode(limitId);
      const ch = children(node);
      const newChildren =
        ch.length === 0
          ? [limitNode]
          : [limitNode, makeOperatorNode(EvalLogicNodeOperatorValueEnum.AND), ...ch];
      return makeGroupNode(newChildren, node.id);
    }
    if (isGroupNode(node)) {
      return makeGroupNode(prependLimitToLevel(children(node), limitId, groupId), node.id);
    }
    return node;
  });
}

/**
 * Insert a limit before the node with the given id (searching recursively).
 * Adds an AND connector in front of the new limit at the insertion point.
 */
export function insertLimitBeforeNode(
  nodes: EvalLogicNode[],
  limitId: string,
  beforeNodeId: string,
): EvalLogicNode[] {
  const idx = nodes.findIndex((n) => n.id === beforeNodeId);
  if (idx >= 0) {
    const limitNode = makeLimitNode(limitId);
    const connectorNode = makeOperatorNode(EvalLogicNodeOperatorValueEnum.AND);
    return [...nodes.slice(0, idx), connectorNode, limitNode, ...nodes.slice(idx)];
  }
  return nodes.map((node) => {
    if (isGroupNode(node)) {
      const ch = children(node);
      const newChildren = insertLimitBeforeNode(ch, limitId, beforeNodeId);
      if (newChildren !== ch) return makeGroupNode(newChildren, node.id);
    }
    return node;
  });
}

/**
 * Remove a LIMIT node by its unique node id, also removing its preceding NOT and connector
 * (or following connector if it's the first item).
 */
export function removeLimitNodeFromArray(nodes: EvalLogicNode[], nodeId: string): EvalLogicNode[] {
  const idx = nodes.findIndex((n) => isLimitNode(n) && n.id === nodeId);

  if (idx >= 0) {
    let removeStart = idx;

    // Include NOT immediately before the limit
    const beforeLimit = nodes[idx - 1];
    if (beforeLimit && isOperatorNode(beforeLimit) && beforeLimit.operatorValue === EvalLogicNodeOperatorValueEnum.NOT) {
      removeStart = idx - 1;
    }

    // Include AND/OR connector before (possibly before the NOT)
    const beforeConnector = nodes[removeStart - 1];
    if (beforeConnector && isOperatorNode(beforeConnector) && beforeConnector.operatorValue !== EvalLogicNodeOperatorValueEnum.NOT) {
      removeStart = removeStart - 1;
    }

    const result = [...nodes.slice(0, removeStart), ...nodes.slice(idx + 1)];

    // If this was the first item, a dangling AND/OR connector is now at position 0 — drop it
    if (removeStart === 0) {
      const newFirst = result[0];
      if (newFirst && isOperatorNode(newFirst) && newFirst.operatorValue !== EvalLogicNodeOperatorValueEnum.NOT) {
        result.shift();
      }
    }

    return result;
  }

  // Recurse into groups
  return nodes.map((node) => {
    if (isGroupNode(node)) {
      const ch = children(node);
      const newChildren = removeLimitNodeFromArray(ch, nodeId);
      if (newChildren !== ch) return makeGroupNode(newChildren, node.id);
    }
    return node;
  });
}

export function toggleNotInArray(nodes: EvalLogicNode[], limitId: string): EvalLogicNode[] {
  const result: EvalLogicNode[] = [];
  for (const node of nodes) {
    if (isLimitNode(node) && node.id === limitId) {
      const prev = result[result.length - 1];
      if (prev && isOperatorNode(prev) && prev.operatorValue === EvalLogicNodeOperatorValueEnum.NOT) {
        result.pop(); // remove existing NOT
      } else {
        result.push(makeOperatorNode(EvalLogicNodeOperatorValueEnum.NOT));
      }
      result.push(node);
    } else if (isGroupNode(node)) {
      result.push(makeGroupNode(toggleNotInArray(children(node), limitId), node.id));
    } else {
      result.push(node);
    }
  }
  return result;
}

export function changeOperatorInArray(
  nodes: EvalLogicNode[],
  operatorId: string,
  newValue: EvalLogicNodeOperatorValueEnum,
): EvalLogicNode[] {
  return nodes.map((node) => {
    if (isOperatorNode(node) && node.id === operatorId) return { ...node, operatorValue: newValue };
    if (isGroupNode(node)) {
      return makeGroupNode(changeOperatorInArray(children(node), operatorId, newValue), node.id);
    }
    return node;
  });
}

export function ungroupInArray(nodes: EvalLogicNode[], groupId: string): EvalLogicNode[] {
  const result: EvalLogicNode[] = [];
  for (const node of nodes) {
    if (isGroupNode(node) && node.id === groupId) {
      result.push(...children(node));
    } else if (isGroupNode(node)) {
      result.push(makeGroupNode(ungroupInArray(children(node), groupId), node.id));
    } else {
      result.push(node);
    }
  }
  return result;
}

function countSelectedAtLevel(nodes: EvalLogicNode[], selectedIds: Set<string>): number {
  return nodes.filter((n) => isLimitNode(n) && selectedIds.has(n.id)).length;
}

/** Returns true if all selected limits are siblings at the same level in the tree. */
export function areSiblings(nodes: EvalLogicNode[], selectedIds: Set<string>): boolean {
  const atRoot = countSelectedAtLevel(nodes, selectedIds);
  if (atRoot === selectedIds.size) return true;
  for (const node of nodes) {
    if (isGroupNode(node) && areSiblings(children(node), selectedIds)) return true;
  }
  return false;
}

/**
 * Wrap selected limits (and operators between/around them) in a GROUP at the appropriate level.
 */
export function groupLimitsInArray(
  nodes: EvalLogicNode[],
  selectedIds: Set<string>,
): EvalLogicNode[] {
  const selectedAtLevel = nodes.filter((n) => isLimitNode(n) && selectedIds.has(n.id));

  if (selectedAtLevel.length >= 2) {
    let firstIdx = -1;
    let lastIdx = -1;
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]!;
      if (isLimitNode(node) && selectedIds.has(node.id)) {
        if (firstIdx === -1) firstIdx = i;
        lastIdx = i;
      }
    }

    // Include a NOT immediately before the first selected limit inside the group
    let sliceStart = firstIdx;
    const prevNode = nodes[firstIdx - 1];
    if (
      prevNode &&
      isOperatorNode(prevNode) &&
      prevNode.operatorValue === EvalLogicNodeOperatorValueEnum.NOT
    ) {
      sliceStart = firstIdx - 1;
    }

    const before = nodes.slice(0, sliceStart);
    const inside = nodes.slice(sliceStart, lastIdx + 1);
    const after = nodes.slice(lastIdx + 1);
    return [...before, makeGroupNode(inside), ...after];
  }

  // Recurse into groups
  return nodes.map((node) => {
    if (isGroupNode(node)) {
      return makeGroupNode(groupLimitsInArray(children(node), selectedIds), node.id);
    }
    return node;
  });
}
