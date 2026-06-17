import { AppNode } from "@/modules/evaluation/graph/editor/nodes/appNode";
import { BooleanSocket } from "@/modules/evaluation/graph/editor/sockets/booleanSocket";
import type { NoControls } from "@/modules/evaluation/graph/editor/types";
import { ClassicPreset } from "rete";

export class ResultNode extends AppNode<
  { in: ClassicPreset.Socket },
  { out: ClassicPreset.Socket },
  NoControls
> {
  controlsHeight = 0;
  initialHeight = this.labelHeight + this.socketHeight + this.controlsHeight;
  initialWidth = 5;

  width = this.getSnappedSize(this.initialWidth);
  height = this.getSnappedSize(this.initialHeight);

  nodeGroup = "result" as const;

  constructor() {
    super({ label: "Result" });

    this.addInput(
      "in",
      new ClassicPreset.Input(new BooleanSocket(), "IN", false),
    );
    this.addOutput(
      "out",
      new ClassicPreset.Output(new BooleanSocket(), "OUT", false),
    );
  }

  clone() {
    return new ResultNode();
  }
}
