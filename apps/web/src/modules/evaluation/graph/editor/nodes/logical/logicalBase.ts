import { AppNode } from "@/modules/evaluation/graph/editor/nodes/appNode";
import { BooleanSocket } from "@/modules/evaluation/graph/editor/sockets/booleanSocket";
import type { NoControls } from "@/modules/evaluation/graph/editor/types";
import { ClassicPreset } from "rete";

type Props = {
  label: string;
  id?: string;
};

export abstract class LogicalNodeBase extends AppNode<
  { in: ClassicPreset.Socket },
  { out: ClassicPreset.Socket },
  NoControls
> {
  controlsHeight = 0;
  initialHeight = this.labelHeight + this.controlsHeight + this.socketHeight;
  initialWidth = 5;

  width = this.getSnappedSize(this.initialWidth);
  height = this.getSnappedSize(this.initialHeight);

  nodeGroup = "logical" as const;

  constructor(props: Props) {
    super(props);

    this.addInput(
      "in",
      new ClassicPreset.Input(new BooleanSocket(), "IN", true),
    );
    this.addOutput(
      "out",
      new ClassicPreset.Output(new BooleanSocket(), "OUT", true),
    );
  }
}
