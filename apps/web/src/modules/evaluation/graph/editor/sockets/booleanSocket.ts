import { ClassicPreset } from "rete";
import { AppSocket } from "./appSocket";

export class BooleanSocket extends AppSocket {
  constructor() {
    super("Boolean");
  }

  isCompatibleWith(socket: ClassicPreset.Socket) {
    return socket instanceof BooleanSocket;
  }
}
