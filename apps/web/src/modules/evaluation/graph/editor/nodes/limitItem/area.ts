import { PercentageRangeControl } from "@/modules/evaluation/graph/editor/controls/percentageRange";
import { QuantifierTypeControl } from "@/modules/evaluation/graph/editor/controls/quantifierType";
import { QuantifierUnitsControl } from "@/modules/evaluation/graph/editor/controls/quantifierUnits";
import type {
  EvalLimitItemQuantifierType,
  EvalLimitItemQuantifierUnit,
} from "@/modules/evaluation/graph/editor/serialization/backendTypes";
import { RuleSocket } from "@/modules/evaluation/graph/editor/sockets/ruleSocket";
import { ClassicPreset } from "rete";
import { LimitItemBase } from "./limitItemBase";

type Props = {
  id?: string;
  limitFrom?: number;
  limitTo?: number;
  quantifierUnit?: EvalLimitItemQuantifierUnit;
  quantifierType?: EvalLimitItemQuantifierType;
  quantifierValue?: number;
};

export class AreaNode extends LimitItemBase<{
  range: PercentageRangeControl;
  units: QuantifierUnitsControl;
  quantifier: QuantifierTypeControl;
}> {
  controlsHeight = 8;
  initialHeight = this.labelHeight + this.controlsHeight + this.socketHeight;
  initialWidth = 12;

  width = this.getSnappedSize(this.initialWidth);
  height = this.getSnappedSize(this.initialHeight);

  constructor(props: Props = {}) {
    const {
      id,
      limitFrom = 0,
      limitTo = 100,
      quantifierValue = 0,
      quantifierUnit = "PCS",
      quantifierType = "EXACT",
    } = props;
    super({ label: "Area", id });

    this.addControl("range", new PercentageRangeControl([limitFrom, limitTo]));
    this.addControl(
      "units",
      new QuantifierUnitsControl({ quantifierValue, quantifierUnit }),
    );
    this.addControl("quantifier", new QuantifierTypeControl(quantifierType));

    this.addInput("in", new ClassicPreset.Input(new RuleSocket(), "IN"));
    this.addOutput("out", new ClassicPreset.Output(new RuleSocket(), "OUT"));
  }

  get limitFrom() {
    return this.controls.range.value[0];
  }

  get limitTo() {
    return this.controls.range.value[1];
  }

  get parameter() {
    return "AREA" as const;
  }

  get targetEdge() {
    return "CENTER" as const;
  }

  get parentEdge() {
    return "CENTER" as const;
  }

  get quantifierType() {
    return this.controls.quantifier.value;
  }

  get quantifierUnit() {
    return this.controls.units.quantifierUnit;
  }
  get quantifierValue() {
    return this.controls.units.value;
  }

  clone() {
    return new AreaNode({
      limitFrom: this.limitFrom,
      limitTo: this.limitTo,
      quantifierUnit: this.quantifierUnit,
      quantifierType: this.quantifierType,
      quantifierValue: this.quantifierValue,
    });
  }
}
