import type { BooleanNodeProps } from "@/modules/evaluation/graph/editor/types";
import { ClassicPreset } from "rete";

export type BooleanOperator = "TRUE" | "NOT";

export class BooleanConnection extends ClassicPreset.Connection<
  BooleanNodeProps,
  BooleanNodeProps
> {
  booleanOperator: BooleanOperator;

  constructor(
    source: BooleanNodeProps,
    sourceOutput: string,
    target: BooleanNodeProps,
    targetInput: string,
    booleanOperator: BooleanOperator = "TRUE",
  ) {
    super(source, sourceOutput as never, target, targetInput as never);
    this.booleanOperator = booleanOperator;
  }
}
