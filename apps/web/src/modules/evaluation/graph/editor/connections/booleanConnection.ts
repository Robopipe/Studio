import type { LogicalProps } from "@/modules/evaluation/graph/editor/types";
import { ClassicPreset } from "rete";

export type BooleanOperator = "TRUE" | "NOT";

export class BooleanConnection extends ClassicPreset.Connection<
  LogicalProps,
  LogicalProps
> {
  booleanOperator: BooleanOperator;

  constructor(
    source: LogicalProps,
    sourceOutput: string,
    target: LogicalProps,
    targetInput: string,
    booleanOperator: BooleanOperator = "TRUE",
  ) {
    super(source, sourceOutput as never, target, targetInput as never);
    this.booleanOperator = booleanOperator;
  }
}
