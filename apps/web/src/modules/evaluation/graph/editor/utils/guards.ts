import { AlertNode } from "@/modules/evaluation/graph/editor/nodes/action/alert";
import { WarningNode } from "@/modules/evaluation/graph/editor/nodes/action/warning";
import { LimitNode } from "@/modules/evaluation/graph/editor/nodes/limit/limit";
import { AreaNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/area";
import { CountNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/count";
import { PositionNode } from "@/modules/evaluation/graph/editor/nodes/limitItem/position";
import { AndNode } from "@/modules/evaluation/graph/editor/nodes/logical/and";
import { OrNode } from "@/modules/evaluation/graph/editor/nodes/logical/or";
import { ResultNode } from "@/modules/evaluation/graph/editor/nodes/result/result";
import type {
  LimitItemProps,
  NodeProps,
} from "@/modules/evaluation/graph/editor/types";

export function isLimitItemNode(node: NodeProps): node is LimitItemProps {
  return (
    node instanceof CountNode ||
    node instanceof PositionNode ||
    node instanceof AreaNode
  );
}

export function isLogicalOperator(node: NodeProps): node is AndNode | OrNode {
  return node instanceof AndNode || node instanceof OrNode;
}

export function isLimitNode(node: NodeProps): node is LimitNode {
  return node instanceof LimitNode;
}

export function isActionNode(node: NodeProps): node is WarningNode | AlertNode {
  return node instanceof WarningNode || node instanceof AlertNode;
}

export function isResultNode(node: NodeProps): node is ResultNode {
  return node instanceof ResultNode;
}
