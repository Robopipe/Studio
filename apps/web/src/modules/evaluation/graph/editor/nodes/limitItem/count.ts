import { IntegerRangeControl } from "@/modules/evaluation/graph/editor/controls/integerRange";
import { RuleSocket } from "@/modules/evaluation/graph/editor/sockets/ruleSocket";
import { ClassicPreset } from "rete";
import { LimitItemBase } from "./limitItemBase";

type Props = {
  id?: string;
  limitFrom?: number | null;
  limitTo?: number | null;
};

export class CountNode extends LimitItemBase<{ count: IntegerRangeControl }> {
  controlsHeight = 4;
  initialHeight = this.labelHeight + this.controlsHeight + this.socketHeight;
  initialWidth = 12;

  width = this.getSnappedSize(this.initialWidth);
  height = this.getSnappedSize(this.initialHeight);

  constructor(props: Props = {}) {
    const { id, limitFrom = null, limitTo = null } = props;

    super({ label: "Count", id });
    this.addControl("count", new IntegerRangeControl({ limitFrom, limitTo }));

    this.addInput("in", new ClassicPreset.Input(new RuleSocket(), "IN"));
    this.addOutput("out", new ClassicPreset.Output(new RuleSocket(), "OUT"));
  }

  get limitFrom() {
    return this.controls.count.value.limitFrom;
  }

  get limitTo() {
    return this.controls.count.value.limitTo;
  }

  get parameter() {
    return "COUNT" as const;
  }

  get targetEdge() {
    return "CENTER" as const;
  }

  get parentEdge() {
    return "CENTER" as const;
  }

  get quantifierType() {
    return "EXACT" as const;
  }

  get quantifierUnit() {
    return "PERCENT" as const;
  }

  get quantifierValue() {
    return 100;
  }

  clone() {
    return new CountNode({ limitFrom: this.limitFrom, limitTo: this.limitTo });
  }
}
