import type { ClassicPreset, GetSchemes } from "rete";
import type { AreaNode } from "./nodes/limitItem/area";
import type { CountNode } from "./nodes/limitItem/count";
import type { PositionNode } from "./nodes/limitItem/position";
import type { BooleanConnection } from "./connections/booleanConnection";
import type { LimitItemConnection } from "./connections/limitItemConnection";
import type { AlertNode } from "./nodes/action/alert";
import type { WarningNode } from "./nodes/action/warning";
import type { LimitNode } from "./nodes/limit/limit";
import type { AndNode } from "./nodes/logical/and";
import type { OrNode } from "./nodes/logical/or";
import type { ResultNode } from "./nodes/result/result";

export type NodeGroup = "rule" | "logical" | "limit" | "action" | "result";

export type LimitItemProps = CountNode | PositionNode | AreaNode;
export type BooleanNodeProps =
  | AndNode
  | OrNode
  | LimitNode
  | WarningNode
  | AlertNode
  | ResultNode;
export type NodeProps = LimitItemProps | BooleanNodeProps;

export type ConnProps = LimitItemConnection | BooleanConnection;

export type Schemes = GetSchemes<NodeProps, ConnProps>;

export type Listener = () => void;
export type NoSockets = Record<never, ClassicPreset.Socket>;
export type NoControls = Record<never, ClassicPreset.Control>;
