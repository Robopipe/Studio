import { PercentageRangeControl } from "@/modules/evaluation/graph/editor/controls/percentageRange";
import { PositionControl } from "@/modules/evaluation/graph/editor/controls/position";
import { QuantifierTypeControl } from "@/modules/evaluation/graph/editor/controls/quantifierType";
import { QuantifierUnitsControl } from "@/modules/evaluation/graph/editor/controls/quantifierUnits";
import { RuleSocket } from "@/modules/evaluation/graph/editor/sockets/ruleSocket";
import {
  EvalLimitItemEdgeEnum,
  EvalLimitItemParameterEnum,
  EvalLimitItemQuantifierTypeEnum,
  EvalLimitItemQuantifierUnitEnum,
} from "@repo/schema";
import { ClassicPreset } from "rete";
import { LimitItemBase } from "./limitItemBase";

type Props = {
  id?: string;
  limitFrom?: number;
  limitTo?: number;
  targetEdge?: EvalLimitItemEdgeEnum;
  parentEdge?: EvalLimitItemEdgeEnum;
  quantifierType?: EvalLimitItemQuantifierTypeEnum;
  quantifierUnit?: EvalLimitItemQuantifierUnitEnum;
  quantifierValue?: number;
};

export class PositionNode extends LimitItemBase<{
  range: PercentageRangeControl;
  units: QuantifierUnitsControl;
  quantifier: QuantifierTypeControl;
  position: PositionControl;
}> {
  controlsHeight = 9;
  initialHeight = this.labelHeight + this.controlsHeight + this.socketHeight;
  initialWidth = 12;

  width = this.getSnappedSize(this.initialWidth);
  height = this.getSnappedSize(this.initialHeight);

  constructor(props: Props = {}) {
    const {
      id,
      limitFrom = 0,
      limitTo = 100,
      targetEdge = EvalLimitItemEdgeEnum.TOP,
      parentEdge = EvalLimitItemEdgeEnum.CENTER,
      quantifierType = EvalLimitItemQuantifierTypeEnum.EXACT,
      quantifierUnit = EvalLimitItemQuantifierUnitEnum.PCS,
      quantifierValue = 0,
    } = props;

    super({ label: "Position", id });

    this.addControl("range", new PercentageRangeControl([limitFrom, limitTo]));
    this.addControl(
      "units",
      new QuantifierUnitsControl({ quantifierValue, quantifierUnit }),
    );
    this.addControl("quantifier", new QuantifierTypeControl(quantifierType));
    this.addControl(
      "position",
      new PositionControl({ targetEdge, parentEdge }),
    );

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
    return EvalLimitItemParameterEnum.POSITION;
  }

  get targetEdge() {
    return this.controls.position.value.targetEdge;
  }

  get parentEdge() {
    return this.controls.position.value.parentEdge;
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
    return new PositionNode({
      limitFrom: this.limitFrom,
      limitTo: this.limitTo,
      targetEdge: this.targetEdge,
      parentEdge: this.parentEdge,
      quantifierType: this.quantifierType,
      quantifierUnit: this.quantifierUnit,
      quantifierValue: this.quantifierValue,
    });
  }
}
