import { ObservableControl } from "./core/observableControl";

type EnabledControlOptions = {
  initialValue?: boolean;
};

// Per-limit enable flag, edited in the graph and persisted on Save (serializeLimits
// reads it). Observable so the header switch re-renders on toggle.
export class EnabledControl extends ObservableControl {
  value: boolean;

  constructor(config: EnabledControlOptions = {}) {
    super();
    this.value = config.initialValue ?? true;
  }

  setValue(next: boolean) {
    if (next === this.value) return;

    this.value = next;
    this.emitChange();
  }

  getSnapshot = () => {
    return this.value;
  };
}
