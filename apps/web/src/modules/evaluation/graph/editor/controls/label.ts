import { ValidatableControl } from "./core/validatableControl";

export type LabelOption = {
  id: number;
  name: string;
};

type LabelControlOptions = {
  required?: boolean;
  initialValue?: number | string | null;
};

export class LabelControl extends ValidatableControl {
  value: string | null;
  readonly options: LabelOption[];
  readonly required: boolean;

  constructor(options: LabelOption[], config: LabelControlOptions = {}) {
    super();

    this.options = options;
    this.required = config.required ?? false;
    this.value = this.normalize(config.initialValue ?? null);
  }

  setValue(value: string | null) {
    const next = this.normalize(value);

    if (next === this.value) return;

    this.value = next;
    this.emitChange();
  }

  clear() {
    this.setValue(null);
  }

  isValid() {
    if (!this.required) return true;

    return this.value !== null;
  }

  getSnapshot = () => {
    return this.value;
  };

  private normalize(value: number | string | null | undefined): string | null {
    // The value is the selected label id as a string; `options` only feeds the
    // dropdown. We intentionally keep any non-empty id (rather than dropping ids
    // not in `options`) so a persisted selection survives even if the label set
    // it references differs from the loaded one.
    if (value == null || value === "") {
      return null;
    }

    return String(value);
  }
}
