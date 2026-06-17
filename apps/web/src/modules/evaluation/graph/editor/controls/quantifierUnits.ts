import type { EvalLimitItemQuantifierUnit } from "@/modules/evaluation/graph/editor/serialization/backendTypes";
import { ObservableControl } from "./core/observableControl";

type Props = {
  quantifierValue: number;
  quantifierUnit: EvalLimitItemQuantifierUnit;
};

export class QuantifierUnitsControl extends ObservableControl {
  value: number;
  quantifierUnit: EvalLimitItemQuantifierUnit;

  private snapshot: Props;

  constructor(initial: Props = { quantifierValue: 0, quantifierUnit: "PCS" }) {
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

  setMode(mode: EvalLimitItemQuantifierUnit) {
    const nextValue = this.normalizeUnitsValue(this.value, mode);

    if (mode === this.quantifierUnit && nextValue === this.value) return;

    this.quantifierUnit = mode;
    this.value = nextValue;
    this.updateSnapshot();
  }

  toggleMode() {
    this.setMode(this.quantifierUnit === "PCS" ? "PERCENT" : "PCS");
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
    mode: EvalLimitItemQuantifierUnit,
  ) {
    if (!Number.isFinite(value)) return 0;
    const rounded = Math.round(value);

    if (mode === "PERCENT") {
      return Math.max(0, Math.min(100, rounded));
    }

    return Math.max(0, rounded);
  }
}
