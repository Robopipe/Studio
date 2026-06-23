import { ClassicPreset } from "rete";

export abstract class AppSocket extends ClassicPreset.Socket {
  connected: boolean = false;
  constructor(label: string) {
    super(label);
  }
  abstract isCompatibleWith(socket: ClassicPreset.Socket): boolean;
}
