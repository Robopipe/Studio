import { AppSocket } from "@/modules/evaluation/graph/editor/sockets/appSocket";
import { BooleanSocket } from "@/modules/evaluation/graph/editor/sockets/booleanSocket";
import type { ClassicPreset } from "rete";

export function SocketView(props: { data: ClassicPreset.Socket }) {
  const isBoolean = props.data instanceof BooleanSocket;
  const connected =
    props.data instanceof AppSocket ? props.data.connected : false;

  return (
    <div
      title={props.data.name}
      className={
        `h-5 w-5 box-border cursor-pointer ${isBoolean ? "rounded-xs" : "rounded-full"} border-2 duration-150 ` +
        (connected
          ? "border-zinc-400 bg-zinc-400"
          : "border-zinc-200 bg-white hover:bg-zinc-400 hover:border-zinc-400")
      }
    />
  );
}
