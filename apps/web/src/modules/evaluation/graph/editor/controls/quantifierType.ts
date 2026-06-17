import type { EvalLimitItemQuantifierType } from "@/modules/evaluation/graph/editor/serialization/backendTypes";
import { ObservableControl } from "./core/observableControl";

export class QuantifierTypeControl extends ObservableControl {
  value: EvalLimitItemQuantifierType;

  constructor(initial: EvalLimitItemQuantifierType = "EXACT") {
    super();

    this.value = this.normalizeQuantifier(initial);
  }

  setValue(value: EvalLimitItemQuantifierType) {
    const next = this.normalizeQuantifier(value);

    if (next === this.value) return;

    this.value = next;
    this.emitChange();
  }

  getSnapshot = () => {
    return this.value;
  };

  private normalizeQuantifier(value: string): EvalLimitItemQuantifierType {
    if (value === "MIN" || value === "MAX" || value === "EXACT") {
      return value;
    }

    return "EXACT";
  }
}
