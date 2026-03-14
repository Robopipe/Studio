import {
  EvalLogicNode,
  EvalLogicNodeOperatorValueEnum,
  EvalLogicNodeTypeEnum,
} from "@repo/schema";
import { v7 as uuidv7 } from "uuid";

// ─── Schema-level type helpers ───────────────────────────────────────────────

export type LimitNode = Extract<
  EvalLogicNode,
  { type: EvalLogicNodeTypeEnum.LIMIT }
>;
export type OperatorNode = Extract<
  EvalLogicNode,
  { type: EvalLogicNodeTypeEnum.OPERATOR }
>;
export type GroupNode = Extract<
  EvalLogicNode,
  { type: EvalLogicNodeTypeEnum.GROUP }
>;

// ─── Render-level types (frontend-only, with renderId) ───────────────────────

export type RenderLimitNode = LimitNode & { renderId: string };
export type RenderOperatorNode = OperatorNode & { renderId: string };
export type RenderGroupNode = Omit<GroupNode, "children"> & {
  renderId: string;
  children: RenderNode[];
};
export type RenderNode = RenderLimitNode | RenderOperatorNode | RenderGroupNode;

export type ProcessedItem = {
  connector: RenderOperatorNode | null; // AND or OR — appears before the item
  not: RenderOperatorNode | null; // NOT — appears right before the item (after connector)
  item: RenderLimitNode | RenderGroupNode;
};

// ─── Type guards ─────────────────────────────────────────────────────────────

function isSchemaGroupNode(node: EvalLogicNode): node is GroupNode {
  return node.type === EvalLogicNodeTypeEnum.GROUP;
}

export function isLimitNode(node: RenderNode): node is RenderLimitNode {
  return node.type === EvalLogicNodeTypeEnum.LIMIT;
}

export function isOperatorNode(node: RenderNode): node is RenderOperatorNode {
  return node.type === EvalLogicNodeTypeEnum.OPERATOR;
}

export function isGroupNode(node: RenderNode): node is RenderGroupNode {
  return node.type === EvalLogicNodeTypeEnum.GROUP;
}

// Zod v4 recursive type inference leaks Record<string,unknown> into GroupNode.children.
// Use this everywhere to avoid widespread ts-ignore.
function schemaChildren(node: GroupNode): EvalLogicNode[] {
  return node.children as EvalLogicNode[];
}

// ─── ID helpers ──────────────────────────────────────────────────────────────

function makeRenderId(): string {
  return uuidv7();
}

// ─── Hydrate / Strip (backend <-> frontend) ──────────────────────────────────

/** Add renderId to every node in the tree (backend -> frontend). */
export function hydrateNodes(nodes: EvalLogicNode[]): RenderNode[] {
  return nodes.map((node) => {
    if (isSchemaGroupNode(node)) {
      return {
        ...node,
        renderId: makeRenderId(),
        children: hydrateNodes(schemaChildren(node)),
      } as RenderGroupNode;
    }
    return { ...node, renderId: makeRenderId() } as RenderNode;
  });
}

/** Strip renderId from every node in the tree (frontend -> backend). */
export function stripRenderIds(nodes: RenderNode[]): EvalLogicNode[] {
  return nodes.map((node) => {
    if (isGroupNode(node)) {
      const { renderId, children, ...rest } = node;
      return {
        ...rest,
        children: stripRenderIds(children),
      } as EvalLogicNode;
    }
    const { renderId, ...rest } = node;
    return rest as EvalLogicNode;
  });
}

// ─── Node factories ──────────────────────────────────────────────────────────

export function makeOperatorNode(
  value: EvalLogicNodeOperatorValueEnum,
): RenderOperatorNode {
  return {
    id: makeRenderId(),
    renderId: makeRenderId(),
    type: EvalLogicNodeTypeEnum.OPERATOR,
    operatorValue: value,
  };
}

export function makeLimitNode(limitId: string): RenderLimitNode {
  return {
    id: limitId,
    renderId: makeRenderId(),
    type: EvalLogicNodeTypeEnum.LIMIT,
  };
}

export function makeGroupNode(
  ch: RenderNode[],
  renderId?: string,
): RenderGroupNode {
  return {
    id: makeRenderId(),
    renderId: renderId ?? makeRenderId(),
    type: EvalLogicNodeTypeEnum.GROUP,
    children: ch,
  };
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export function getAllLimitIds(nodes: RenderNode[]): Set<string> {
  const ids = new Set<string>();
  const traverse = (arr: RenderNode[]) => {
    for (const node of arr) {
      if (isLimitNode(node)) ids.add(node.id);
      if (isGroupNode(node)) traverse(node.children);
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
export function processNodes(nodes: RenderNode[]): ProcessedItem[] {
  const result: ProcessedItem[] = [];
  let pendingConnector: RenderOperatorNode | null = null;
  let pendingNot: RenderOperatorNode | null = null;

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
        item: node as RenderLimitNode | RenderGroupNode,
      });
      pendingConnector = null;
      pendingNot = null;
    }
  }
  return result;
}

/**
 * Get the renderId to use as the "insert before" reference for a gap before this item.
 * The insertion point is at the first node belonging to this item (connector > not > item).
 */
export function getInsertBeforeId(pi: ProcessedItem): string {
  return pi.connector?.renderId ?? pi.not?.renderId ?? pi.item.renderId;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function appendLimitToLevel(
  nodes: RenderNode[],
  limitId: string,
  groupRenderId: string | null,
): RenderNode[] {
  if (groupRenderId === null) {
    const limitNode = makeLimitNode(limitId);
    if (nodes.length === 0) return [limitNode];
    return [
      ...nodes,
      makeOperatorNode(EvalLogicNodeOperatorValueEnum.AND),
      limitNode,
    ];
  }
  return nodes.map((node) => {
    if (isGroupNode(node) && node.renderId === groupRenderId) {
      const limitNode = makeLimitNode(limitId);
      const ch = node.children;
      const newChildren =
        ch.length === 0
          ? [limitNode]
          : [
              ...ch,
              makeOperatorNode(EvalLogicNodeOperatorValueEnum.AND),
              limitNode,
            ];
      return makeGroupNode(newChildren, node.renderId);
    }
    if (isGroupNode(node)) {
      return makeGroupNode(
        appendLimitToLevel(node.children, limitId, groupRenderId),
        node.renderId,
      );
    }
    return node;
  });
}

export function prependLimitToLevel(
  nodes: RenderNode[],
  limitId: string,
  groupRenderId: string | null,
): RenderNode[] {
  if (groupRenderId === null) {
    const limitNode = makeLimitNode(limitId);
    if (nodes.length === 0) return [limitNode];
    return [
      limitNode,
      makeOperatorNode(EvalLogicNodeOperatorValueEnum.AND),
      ...nodes,
    ];
  }
  return nodes.map((node) => {
    if (isGroupNode(node) && node.renderId === groupRenderId) {
      const limitNode = makeLimitNode(limitId);
      const ch = node.children;
      const newChildren =
        ch.length === 0
          ? [limitNode]
          : [
              limitNode,
              makeOperatorNode(EvalLogicNodeOperatorValueEnum.AND),
              ...ch,
            ];
      return makeGroupNode(newChildren, node.renderId);
    }
    if (isGroupNode(node)) {
      return makeGroupNode(
        prependLimitToLevel(node.children, limitId, groupRenderId),
        node.renderId,
      );
    }
    return node;
  });
}

/**
 * Insert a limit before the node with the given renderId (searching recursively).
 * Adds an AND connector in front of the new limit at the insertion point.
 */
export function insertLimitBeforeNode(
  nodes: RenderNode[],
  limitId: string,
  beforeRenderId: string,
): RenderNode[] {
  const idx = nodes.findIndex((n) => n.renderId === beforeRenderId);
  if (idx >= 0) {
    const limitNode = makeLimitNode(limitId);
    const connectorNode = makeOperatorNode(EvalLogicNodeOperatorValueEnum.AND);
    return [
      ...nodes.slice(0, idx),
      connectorNode,
      limitNode,
      ...nodes.slice(idx),
    ];
  }
  return nodes.map((node) => {
    if (isGroupNode(node)) {
      const ch = node.children;
      const newChildren = insertLimitBeforeNode(ch, limitId, beforeRenderId);
      if (newChildren !== ch) return makeGroupNode(newChildren, node.renderId);
    }
    return node;
  });
}

/**
 * Remove a LIMIT node by its unique renderId, also removing its preceding NOT and connector
 * (or following connector if it's the first item).
 */
export function removeLimitNodeFromArray(
  nodes: RenderNode[],
  renderId: string,
): RenderNode[] {
  const idx = nodes.findIndex((n) => isLimitNode(n) && n.renderId === renderId);

  if (idx >= 0) {
    let removeStart = idx;

    // Include NOT immediately before the limit
    const beforeLimit = nodes[idx - 1];
    if (
      beforeLimit &&
      isOperatorNode(beforeLimit) &&
      beforeLimit.operatorValue === EvalLogicNodeOperatorValueEnum.NOT
    ) {
      removeStart = idx - 1;
    }

    // Include AND/OR connector before (possibly before the NOT)
    const beforeConnector = nodes[removeStart - 1];
    if (
      beforeConnector &&
      isOperatorNode(beforeConnector) &&
      beforeConnector.operatorValue !== EvalLogicNodeOperatorValueEnum.NOT
    ) {
      removeStart = removeStart - 1;
    }

    const result = [...nodes.slice(0, removeStart), ...nodes.slice(idx + 1)];

    // If this was the first item, a dangling AND/OR connector is now at position 0 — drop it
    if (removeStart === 0) {
      const newFirst = result[0];
      if (
        newFirst &&
        isOperatorNode(newFirst) &&
        newFirst.operatorValue !== EvalLogicNodeOperatorValueEnum.NOT
      ) {
        result.shift();
      }
    }

    return result;
  }

  // Recurse into groups
  return nodes.map((node) => {
    if (isGroupNode(node)) {
      const ch = node.children;
      const newChildren = removeLimitNodeFromArray(ch, renderId);
      if (newChildren !== ch) return makeGroupNode(newChildren, node.renderId);
    }
    return node;
  });
}

export function toggleNotInArray(
  nodes: RenderNode[],
  renderId: string,
): RenderNode[] {
  const result: RenderNode[] = [];
  for (const node of nodes) {
    if (isLimitNode(node) && node.renderId === renderId) {
      const prev = result[result.length - 1];
      if (
        prev &&
        isOperatorNode(prev) &&
        prev.operatorValue === EvalLogicNodeOperatorValueEnum.NOT
      ) {
        result.pop(); // remove existing NOT
      } else {
        result.push(makeOperatorNode(EvalLogicNodeOperatorValueEnum.NOT));
      }
      result.push(node);
    } else if (isGroupNode(node)) {
      result.push(
        makeGroupNode(toggleNotInArray(node.children, renderId), node.renderId),
      );
    } else {
      result.push(node);
    }
  }
  return result;
}

export function changeOperatorInArray(
  nodes: RenderNode[],
  operatorRenderId: string,
  newValue: EvalLogicNodeOperatorValueEnum,
): RenderNode[] {
  return nodes.map((node) => {
    if (isOperatorNode(node) && node.renderId === operatorRenderId)
      return { ...node, operatorValue: newValue };
    if (isGroupNode(node)) {
      return makeGroupNode(
        changeOperatorInArray(node.children, operatorRenderId, newValue),
        node.renderId,
      );
    }
    return node;
  });
}

export function ungroupInArray(
  nodes: RenderNode[],
  groupRenderId: string,
): RenderNode[] {
  const result: RenderNode[] = [];
  for (const node of nodes) {
    if (isGroupNode(node) && node.renderId === groupRenderId) {
      result.push(...node.children);
    } else if (isGroupNode(node)) {
      result.push(
        makeGroupNode(
          ungroupInArray(node.children, groupRenderId),
          node.renderId,
        ),
      );
    } else {
      result.push(node);
    }
  }
  return result;
}

function countSelectedAtLevel(
  nodes: RenderNode[],
  selectedRenderIds: Set<string>,
): number {
  return nodes.filter(
    (n) => isLimitNode(n) && selectedRenderIds.has(n.renderId),
  ).length;
}

/** Returns true if all selected limits are siblings at the same level in the tree. */
export function areSiblings(
  nodes: RenderNode[],
  selectedRenderIds: Set<string>,
): boolean {
  const atRoot = countSelectedAtLevel(nodes, selectedRenderIds);
  if (atRoot === selectedRenderIds.size) return true;
  for (const node of nodes) {
    if (isGroupNode(node) && areSiblings(node.children, selectedRenderIds))
      return true;
  }
  return false;
}

/**
 * Wrap selected limits (and operators between/around them) in a GROUP at the appropriate level.
 */
export function groupLimitsInArray(
  nodes: RenderNode[],
  selectedRenderIds: Set<string>,
): RenderNode[] {
  const selectedAtLevel = nodes.filter(
    (n) => isLimitNode(n) && selectedRenderIds.has(n.renderId),
  );

  if (selectedAtLevel.length >= 2) {
    let firstIdx = -1;
    let lastIdx = -1;
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]!;
      if (isLimitNode(node) && selectedRenderIds.has(node.renderId)) {
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
      return makeGroupNode(
        groupLimitsInArray(node.children, selectedRenderIds),
        node.renderId,
      );
    }
    return node;
  });
}
