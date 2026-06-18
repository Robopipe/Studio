import type { LimitItemProps } from "@/modules/evaluation/graph/editor/types";
import { EvalLimitItemOperatorEnum } from "@repo/schema";
import { ClassicPreset } from "rete";

export class LimitItemConnection extends ClassicPreset.Connection<
  LimitItemProps,
  LimitItemProps
> {
  limitItemOperator: EvalLimitItemOperatorEnum;

  constructor(
    source: LimitItemProps,
    sourceOutput: string,
    target: LimitItemProps,
    targetInput: string,
    limitItemOperator: EvalLimitItemOperatorEnum = EvalLimitItemOperatorEnum.AND,
  ) {
    super(source, sourceOutput as never, target, targetInput as never);
    this.limitItemOperator = limitItemOperator;
  }
}
