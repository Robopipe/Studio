import type { Schemes } from "@/modules/evaluation/graph/editor/types";
import { useEffect, useRef, useState } from "react";
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
  const subscribedRef = useRef(false);

  useEffect(() => {
    // FIX(react): the subscribedRef guard means a new `editor` prop instance is never subscribed (the effect re-runs but bails), and the pipe added to the old editor is never disabled on unmount, so setTick keeps firing on an unmounted component — fix: drop the ref, subscribe unconditionally in the effect, and return a cleanup that flips a `disposed` flag making the pipe a no-op (rete has no removePipe); why: editor swaps show stale counts and every mount/unmount cycle leaks one more live pipe.
    if (subscribedRef.current) return;
    subscribedRef.current = true;

    // FIX(perf): the pipe is registered and setTick re-renders fire on every node/connection event even when VITE_DEBUG is off, i.e. in production builds where the component just renders null — fix: guard the effect body with isDebugEnabled() (Vite statically replaces import.meta.env, so the dead branch is dropped from prod bundles); why: debug-only bookkeeping runs on the hot editor event pipeline in production.
    editor.addPipe((context) => {
      if (WATCHED_EVENTS.has(context.type)) {
        setTick((prev) => prev + 1);
      }
      return context;
    });
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
