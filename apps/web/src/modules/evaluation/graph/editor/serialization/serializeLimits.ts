import { LimitItemConnection } from "@/modules/evaluation/graph/editor/connections/limitItemConnection";
import { ActionNodeBase } from "@/modules/evaluation/graph/editor/nodes/action/actionBase";
import { LimitNode } from "@/modules/evaluation/graph/editor/nodes/limit/limit";
import type {
  LimitItemProps,
  Schemes,
} from "@/modules/evaluation/graph/editor/types";
import {
  isLimitItemNode,
  isLimitNode,
} from "@/modules/evaluation/graph/editor/utils/guards";
import type {
  EvalSeverityEnum,
  EvalTestCaseFullCreateOrUpdate,
} from "@repo/schema";
import type { NodeEditor } from "rete";
import { serializeLimitItemNode } from "./serializeLimitItems";
import { parseNullableNumber, parseRequiredNumber } from "./utils";

export type FullLimit = NonNullable<
  EvalTestCaseFullCreateOrUpdate["limits"]
>[number];

export function serializeLimits(
  editor: NodeEditor<Schemes>,
): FullLimit[] {
  return editor
    .getNodes()
    .filter(isLimitNode)
    .map((limitNode) => serializeLimitNode(editor, limitNode));
}

export function serializeLimitNode(
  editor: NodeEditor<Schemes>,
  limitNode: LimitNode,
): FullLimit {
  const limitItems = getLimitItemChildren(editor, limitNode).map((node) =>
    serializeLimitItemNode(editor, node),
  );

  return {
    id: limitNode.id,
    name: limitNode.name,
    severity: getLimitSeverity(editor, limitNode),
    enabled: limitNode.enabledValue,
    targetLabelId: parseRequiredNumber(
      limitNode.labelValue,
      "Limit label is required.",
    ),
    targetParentLabelId: parseNullableNumber(limitNode.parentLabelValue),
    limitItems,
  };
}

function getLimitItemChildren(
  editor: NodeEditor<Schemes>,
  limitNode: LimitNode,
): LimitItemProps[] {
  const children = editor
    .getNodes()
    .filter((node) => node.parent === limitNode.id)
    .filter(isLimitItemNode);

  return orderByConnectionChain(editor, children);
}

// LimitItems form a single 1:1 chain (no loops, no branching — both
// guaranteed by graph validation). editor.getNodes() returns insertion order,
// which goes stale after a reorder, so we recover the real order by walking
// the chain: start at the node with no incoming connection (the head) and
// follow each outgoing connection to its target until the tail.
function orderByConnectionChain(
  editor: NodeEditor<Schemes>,
  nodes: LimitItemProps[],
): LimitItemProps[] {
  if (nodes.length <= 1) return nodes;

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const nextById = new Map<string, string>();
  const targets = new Set<string>();

  for (const connection of editor.getConnections()) {
    if (!(connection instanceof LimitItemConnection)) continue;
    if (!nodeById.has(connection.source) || !nodeById.has(connection.target))
      continue;

    nextById.set(connection.source, connection.target);
    targets.add(connection.target);
  }

  const head = nodes.find((node) => !targets.has(node.id));
  if (!head) return nodes;

  const ordered: LimitItemProps[] = [];
  const visited = new Set<string>();

  let currentId: string | undefined = head.id;
  while (currentId && !visited.has(currentId)) {
    const node = nodeById.get(currentId);
    if (!node) break;

    ordered.push(node);
    visited.add(currentId);
    currentId = nextById.get(currentId);
  }

  // Fallback: if some children weren't reachable through the chain (e.g.
  // disconnected mid-edit), keep them rather than dropping them on save.
  return ordered.length === nodes.length
    ? ordered
    : [...ordered, ...nodes.filter((node) => !visited.has(node.id))];
}

function getLimitSeverity(
  editor: NodeEditor<Schemes>,
  limitNode: LimitNode,
): EvalSeverityEnum | null {
  const actionNode = editor
    .getConnections()
    .filter((connection) => connection.source === limitNode.id)
    .map((connection) => editor.getNode(connection.target))
    .find((node) => node instanceof ActionNodeBase);

  return actionNode instanceof ActionNodeBase ? actionNode.evalSeverity : null;
}
