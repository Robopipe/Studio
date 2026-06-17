import { AppNode } from "@/modules/evaluation/graph/editor/nodes/appNode";
import type {
  EvalLimitItemEdge,
  EvalLimitItemParameter,
  EvalLimitItemQuantifierType,
  EvalLimitItemQuantifierUnit,
} from "@/modules/evaluation/graph/editor/serialization/backendTypes";
import { ClassicPreset } from "rete";

type Props = {
  label: string;
  id?: string;
};

export abstract class LimitItemBase<
  C extends Record<string, ClassicPreset.Control>,
> extends AppNode<
  { in: ClassicPreset.Socket },
  { out: ClassicPreset.Socket },
  C
> {
  nodeGroup = "rule" as const;

  constructor(props: Props) {
    super(props);
  }

  abstract get limitFrom(): number | null;
  abstract get limitTo(): number | null;
  abstract get parameter(): EvalLimitItemParameter;
  // Edges are only meaningful for POSITION; AREA/COUNT report CENTER.
  abstract get targetEdge(): EvalLimitItemEdge;
  abstract get parentEdge(): EvalLimitItemEdge;
  abstract get quantifierType(): EvalLimitItemQuantifierType;
  abstract get quantifierUnit(): EvalLimitItemQuantifierUnit;
  abstract get quantifierValue(): number;
}
