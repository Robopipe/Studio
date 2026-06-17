import { ObservableControl } from "./core/observableControl";

type PercentageRangeValue = [number, number];

export class PercentageRangeControl extends ObservableControl {
  value: PercentageRangeValue;
  readonly min = 0;
  readonly max = 100;
  readonly step = 1;

  constructor(initial: PercentageRangeValue = [0, 100]) {
    super();
    this.value = this.normalizeRange(initial);
  }

  setValue(value: number[]) {
    const next = this.normalizeRange(value);
    if (next[0] === this.value[0] && next[1] === this.value[1]) return;
    this.value = next;
    this.emitChange();
  }

  getSnapshot = () => this.value;

  private normalizeRange(value: number[]): PercentageRangeValue {
    const a = this.clampInt(value[0] ?? 0);
    const b = this.clampInt(value[1] ?? 100);

    return a <= b ? [a, b] : [b, a];
  }

  private clampInt(value: number) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, Math.round(value)));
  }
}
