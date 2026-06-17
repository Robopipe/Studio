import type { EvalLimitItemOperator } from "@/modules/evaluation/graph/editor/serialization/backendTypes";
import type { LimitItemProps } from "@/modules/evaluation/graph/editor/types";
import { ClassicPreset } from "rete";

export class LimitItemConnection extends ClassicPreset.Connection<
  LimitItemProps,
  LimitItemProps
> {
  limitItemOperator: EvalLimitItemOperator;

  constructor(
    source: LimitItemProps,
    sourceOutput: string,
    target: LimitItemProps,
    targetInput: string,
    limitItemOperator: EvalLimitItemOperator = "AND",
  ) {
    super(source, sourceOutput as never, target, targetInput as never);
    this.limitItemOperator = limitItemOperator;
  }
}
