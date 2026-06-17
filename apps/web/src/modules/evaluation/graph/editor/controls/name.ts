import { ValidatableControl } from "./core/validatableControl";

type NameControlOptions = {
  initialValue?: string | null;
};

export class NameControl extends ValidatableControl {
  value: string;

  constructor(config: NameControlOptions = {}) {
    super();
    this.value = this.normalize(config.initialValue ?? "");
  }

  setValue(next: string) {
    const normalized = this.normalize(next);
    if (normalized === this.value) return;

    this.value = normalized;
    this.emitChange();
  }

  isValid() {
    return this.value.trim().length > 0;
  }

  getSnapshot = () => {
    return this.value;
  };

  private normalize(value: string | null | undefined) {
    return value ?? "";
  }
}
