import { EvalLimitItemQuantifierTypeEnum } from "@repo/schema";
import { ObservableControl } from "./core/observableControl";

export class QuantifierTypeControl extends ObservableControl {
  value: EvalLimitItemQuantifierTypeEnum;

  constructor(
    initial: EvalLimitItemQuantifierTypeEnum = EvalLimitItemQuantifierTypeEnum.EXACT,
  ) {
    super();

    this.value = this.normalizeQuantifier(initial);
  }

  setValue(value: EvalLimitItemQuantifierTypeEnum) {
    const next = this.normalizeQuantifier(value);

    if (next === this.value) return;

    this.value = next;
    this.emitChange();
  }

  getSnapshot = () => {
    return this.value;
  };

  private normalizeQuantifier(
    value: string,
  ): EvalLimitItemQuantifierTypeEnum {
    if (
      value === EvalLimitItemQuantifierTypeEnum.MIN ||
      value === EvalLimitItemQuantifierTypeEnum.MAX ||
      value === EvalLimitItemQuantifierTypeEnum.EXACT
    ) {
      return value;
    }

    return EvalLimitItemQuantifierTypeEnum.EXACT;
  }
}
