import { AppNode } from "@/modules/evaluation/graph/editor/nodes/appNode";
import type { EvalSeverityEnum } from "@repo/schema";
import { BooleanSocket } from "@/modules/evaluation/graph/editor/sockets/booleanSocket";
import type {
  NoControls,
  NoSockets,
} from "@/modules/evaluation/graph/editor/types";
import { ClassicPreset } from "rete";

type Props = {
  label: string;
  evalSeverity: EvalSeverityEnum;
  id?: string;
};
export abstract class ActionNodeBase extends AppNode<
  { in: ClassicPreset.Socket },
  NoSockets,
  NoControls
> {
  controlsHeight = 0;
  initialHeight = this.labelHeight + this.controlsHeight + this.socketHeight;
  initialWidth = 5;

  width = this.getSnappedSize(this.initialWidth);
  height = this.getSnappedSize(this.initialHeight);

  nodeGroup = "action" as const;

  evalSeverity: EvalSeverityEnum;

  constructor(props: Props) {
    const { label, evalSeverity, id } = props;
    super({ label, id });

    this.addInput(
      "in",
      new ClassicPreset.Input(new BooleanSocket(), "IN", false),
    );
    this.evalSeverity = evalSeverity;
  }

  abstract clone(): ActionNodeBase;
}
