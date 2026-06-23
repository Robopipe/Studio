import type { Schemes } from "@/modules/evaluation/graph/editor/types";
import { useEffect, useState } from "react";
import type { NodeEditor } from "rete";
import { isDebugEnabled } from "./isDebugEnabled";

type Props = {
  editor: NodeEditor<Schemes>;
};

const WATCHED_EVENTS = new Set([
  "nodecreated",
  "noderemoved",
  "connectioncreated",
  "connectionremoved",
]);

export const EditorDebugOverlay = ({ editor }: Props) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    // Debug-only: skip entirely when disabled so the pipe never runs in prod
    // (Vite statically replaces import.meta.env, dropping this branch).
    if (!isDebugEnabled()) return;

    // rete has no removePipe, so the cleanup flips a flag making the pipe a no-op
    // after unmount (or when the editor prop changes), instead of leaking a live pipe.
    let disposed = false;
    editor.addPipe((context) => {
      if (!disposed && WATCHED_EVENTS.has(context.type)) {
        setTick((prev) => prev + 1);
      }
      return context;
    });

    return () => {
      disposed = true;
    };
  }, [editor]);

  if (!isDebugEnabled()) return null;

  const nodeCount = editor.getNodes().length;
  const connectionCount = editor.getConnections().length;

  return (
    <div
      className={`
        pointer-events-none absolute left-4 top-4 z-50
        rounded-md border border-zinc-300 bg-white/90 px-3 py-1.5
        font-mono text-xs text-zinc-700 shadow-sm
      `}
    >
      <div>nodes: {nodeCount}</div>
      <div>connections: {connectionCount}</div>
    </div>
  );
};
