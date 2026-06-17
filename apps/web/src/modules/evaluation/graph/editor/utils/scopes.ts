import { LimitNode } from "@/modules/evaluation/graph/editor/nodes/limit/limit";
import type { NodeProps } from "@/modules/evaluation/graph/editor/types";

export function canHaveChildren(node: NodeProps | undefined): boolean {
  return !!node && node.allowedChildGroups.length > 0;
}

export function canBeChildOf(
  child: NodeProps | undefined,
  parent: NodeProps | undefined,
): boolean {
  if (!child || !parent) return false;
  return parent.allowedChildGroups.includes(child.nodeGroup);
}

export function isScopeNode(node: NodeProps | undefined): node is LimitNode {
  return node instanceof LimitNode;
}
