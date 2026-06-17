import type { ClassicPreset, GetSchemes } from "rete";
import type { AreaNode } from "./nodes/limitItem/area";
import type { CountNode } from "./nodes/limitItem/count";
import type { PositionNode } from "./nodes/limitItem/position";
// FIX(consistency): LimitNode is the only value import in this otherwise type-only module (all
// siblings use `import type`) and it is only used in a type position below — fix: change to
// `import type { LimitNode } ...`; why: a value import pulls the LimitNode module (and its
// control/socket dependency graph) into every bundle that imports these types.
import type { BooleanConnection } from "./connections/booleanConnection";
import type { LimitItemConnection } from "./connections/limitItemConnection";
import type { AlertNode } from "./nodes/action/alert";
import type { WarningNode } from "./nodes/action/warning";
import { LimitNode } from "./nodes/limit/limit";
import type { AndNode } from "./nodes/logical/and";
import type { OrNode } from "./nodes/logical/or";
import type { ResultNode } from "./nodes/result/result";

export type NodeGroup = "rule" | "logical" | "limit" | "action" | "result";

export type LimitItemProps = CountNode | PositionNode | AreaNode;
// FIX(naming): LogicalProps actually means "any node connectable via BooleanConnection" and
// includes Limit, Warning, Alert and Result nodes, while elsewhere "logical" means only AND/OR
// (nodeGroup 'logical', isLogicalOperator guard, nodes/logical/ folder) — fix: rename to
// something like BooleanNodeProps/BooleanGraphProps; why: the same word meaning two different
// node sets invites wrong instanceof assumptions at the BooleanConnection casts.
export type LogicalProps =
  | AndNode
  | OrNode
  | LimitNode
  | WarningNode
  | AlertNode
  | ResultNode;
export type NodeProps = LimitItemProps | LogicalProps;

export type ConnProps = LimitItemConnection | BooleanConnection;

export type Schemes = GetSchemes<NodeProps, ConnProps>;

export type Listener = () => void;
export type NoSockets = Record<never, ClassicPreset.Socket>;
export type NoControls = Record<never, ClassicPreset.Control>;
