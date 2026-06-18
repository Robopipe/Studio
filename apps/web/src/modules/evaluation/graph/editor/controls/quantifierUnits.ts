import { EvalLimitItemQuantifierUnitEnum } from "@repo/schema";
import { ObservableControl } from "./core/observableControl";

type Props = {
  quantifierValue: number;
  quantifierUnit: EvalLimitItemQuantifierUnitEnum;
};

export class QuantifierUnitsControl extends ObservableControl {
  value: number;
  quantifierUnit: EvalLimitItemQuantifierUnitEnum;

  private snapshot: Props;

  constructor(
    initial: Props = {
      quantifierValue: 0,
      quantifierUnit: EvalLimitItemQuantifierUnitEnum.PCS,
    },
  ) {
    super();

    this.quantifierUnit = initial.quantifierUnit;
    this.value = this.normalizeUnitsValue(
      initial.quantifierValue,
      this.quantifierUnit,
    );
    this.snapshot = {
      quantifierValue: this.value,
      quantifierUnit: this.quantifierUnit,
    };
  }

  setValue(value: number) {
    const next = this.normalizeUnitsValue(value, this.quantifierUnit);
    if (next === this.value) return;

    this.value = next;
    this.updateSnapshot();
  }

  setMode(mode: EvalLimitItemQuantifierUnitEnum) {
    const nextValue = this.normalizeUnitsValue(this.value, mode);

    if (mode === this.quantifierUnit && nextValue === this.value) return;

    this.quantifierUnit = mode;
    this.value = nextValue;
    this.updateSnapshot();
  }

  toggleMode() {
    this.setMode(
      this.quantifierUnit === EvalLimitItemQuantifierUnitEnum.PCS
        ? EvalLimitItemQuantifierUnitEnum.PERCENT
        : EvalLimitItemQuantifierUnitEnum.PCS,
    );
  }

  getSnapshot = () => {
    return this.snapshot;
  };

  private updateSnapshot() {
    this.snapshot = {
      quantifierValue: this.value,
      quantifierUnit: this.quantifierUnit,
    };

    this.emitChange();
  }

  private normalizeUnitsValue(
    value: number,
    mode: EvalLimitItemQuantifierUnitEnum,
  ) {
    if (!Number.isFinite(value)) return 0;
    const rounded = Math.round(value);

    if (mode === EvalLimitItemQuantifierUnitEnum.PERCENT) {
      return Math.max(0, Math.min(100, rounded));
    }

    return Math.max(0, rounded);
  }
}
