import { ObservableControl } from "./core/observableControl";

export type IntegerRangeValue = {
  limitFrom: number | null;
  limitTo: number | null;
};

export class IntegerRangeControl extends ObservableControl {
  value: IntegerRangeValue;

  readonly min = 0;
  readonly step = 1;

  constructor(initial: IntegerRangeValue = { limitFrom: null, limitTo: null }) {
    super();

    this.value = this.normalizeRange(initial);
  }

  get limitFrom() {
    return this.value.limitFrom;
  }

  get limitTo() {
    return this.value.limitTo;
  }

  setLimitFrom(value: number | null) {
    const limitFrom = this.normalizeInteger(value);

    this.setValue({
      limitFrom,
      limitTo:
        limitFrom !== null &&
        this.value.limitTo !== null &&
        limitFrom > this.value.limitTo
          ? null
          : this.value.limitTo,
    });
  }

  setLimitTo(value: number | null) {
    const limitTo = this.normalizeInteger(value);

    this.setValue({
      limitFrom:
        limitTo !== null &&
        this.value.limitFrom !== null &&
        limitTo < this.value.limitFrom
          ? null
          : this.value.limitFrom,
      limitTo,
    });
  }

  setValue(value: IntegerRangeValue) {
    const next = this.normalizeRange(value);

    if (
      next.limitFrom === this.value.limitFrom &&
      next.limitTo === this.value.limitTo
    )
      return;

    this.value = next;
    this.emitChange();
  }

  getSnapshot = () => {
    return this.value;
  };

  private normalizeRange(value: IntegerRangeValue): IntegerRangeValue {
    const limitFrom = this.normalizeInteger(value.limitFrom);
    const limitTo = this.normalizeInteger(value.limitTo);

    if (limitFrom !== null && limitTo !== null && limitFrom > limitTo) {
      return {
        limitFrom,
        limitTo: null,
      };
    }

    return {
      limitFrom,
      limitTo,
    };
  }

  private normalizeInteger(value: number | null | undefined) {
    if (value === null || value === undefined) return null;
    if (!Number.isFinite(value)) return null;

    return Math.max(0, Math.round(value));
  }
}
