import { ClassicPreset } from "rete";
import { AppSocket } from "./appSocket";

export class RuleSocket extends AppSocket {
  constructor() {
    super("Rule");
  }

  isCompatibleWith(socket: ClassicPreset.Socket) {
    return socket instanceof RuleSocket;
  }
}
