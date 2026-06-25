import { AppNode } from "@/modules/evaluation/graph/editor/nodes/appNode";
import type {
  EvalLimitItemEdgeEnum,
  EvalLimitItemParameterEnum,
  EvalLimitItemQuantifierTypeEnum,
  EvalLimitItemQuantifierUnitEnum,
} from "@repo/schema";
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
  abstract get parameter(): EvalLimitItemParameterEnum;
  abstract get targetEdge(): EvalLimitItemEdgeEnum;
  abstract get parentEdge(): EvalLimitItemEdgeEnum;
  abstract get quantifierType(): EvalLimitItemQuantifierTypeEnum;
  abstract get quantifierUnit(): EvalLimitItemQuantifierUnitEnum;
  abstract get quantifierValue(): number;
}
