import type { Listener } from "@/modules/evaluation/graph/editor/types";
import { ClassicPreset } from "rete";

export abstract class ObservableControl extends ClassicPreset.Control {
  private listeners = new Set<Listener>();

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  };

  protected emitChange() {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
