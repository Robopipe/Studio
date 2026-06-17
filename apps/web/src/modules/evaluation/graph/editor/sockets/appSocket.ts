import { ClassicPreset } from "rete";

// FIX(structure): both subclasses (BooleanSocket, RuleSocket) implement isCompatibleWith but the
// base class does not declare it, so setupConnections.ts:221-236 has to duck-type it through two
// `as { isCompatibleWith?: ... }` casts — fix: declare
// `abstract isCompatibleWith(socket: ClassicPreset.Socket): boolean` here (and make the class
// abstract) so consumers can call it after a plain `instanceof AppSocket` check; why: removes
// unsafe casts and guarantees every future socket type implements compatibility.
export class AppSocket extends ClassicPreset.Socket {
  connected: boolean = false;
  constructor(label: string) {
    super(label);
  }
}
