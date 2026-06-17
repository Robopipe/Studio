import { BooleanConnectionToggle } from "@/modules/evaluation/graph/editor/ui/components/ConnectionToggle";
import { useLayoutEffect, useRef, useState } from "react";
import type { ClassicScheme } from "rete-react-plugin";
import { Presets } from "rete-react-plugin";

const { useConnection } = Presets.classic;

type ToggleOptionPair<T extends string> = readonly [T, T];

type ToggleConnectionData = ClassicScheme["Connection"] & {
  id: string;
  source?: string;
  target?: string;
};

type Props<T extends string, C extends ToggleConnectionData> = {
  refreshConnection: (id: string) => void;
  options: ToggleOptionPair<T>;
  fallback: T;
  getValue: (connection: C) => T | undefined;
  setValue: (connection: C, value: T) => void;
  getLabel?: (value: T) => string;
};

export function createToggleConnectionView<
  T extends string,
  C extends ToggleConnectionData,
>({
  refreshConnection,
  options,
  fallback,
  getValue,
  setValue,
  getLabel,
}: Props<T, C>) {
  // FIX(perf): every call to this factory returns a brand-new component identity, and setupRender.ts invokes createBoolean/LimitItemConnectionView inside the per-connection `customize.connection` callback — fix: create each configured view once at module/setup scope (or memoize by options) and return the cached component; why: a new component type per render decision makes React unmount/remount the connection subtree on every area update, losing the `mid` state and restarting the dash animation in a hot canvas path.
  return function ToggleConnectionView(props: { data: C }) {
    const { path } = useConnection();
    const pathRef = useRef<SVGPathElement | null>(null);
    const [mid, setMid] = useState<{ x: number; y: number } | null>(null);
    // FIX(react): animationDelay is recomputed from performance.now() on every render, so each re-render (e.g. the setMid layout effect, drags, toggles) writes a new animation-delay and makes the dash animation jump phase; it is also a render-time side-input that breaks render purity — fix: capture it once per mount, e.g. const [animationDelay] = useState(() => `-${performance.now() % 1000}ms`); why: connections re-render constantly while dragging nodes, producing visible animation stutter.
    const animationDelay = `-${performance.now() % 1000}ms`;

    useLayoutEffect(() => {
      const el = pathRef.current;

      if (!el || !path) {
        setMid(null);
        return;
      }

      try {
        const len = el.getTotalLength();
        const p = el.getPointAtLength(len / 2);
        setMid({ x: p.x, y: p.y });
      } catch {
        setMid(null);
      }
    }, [path]);

    if (!path) return null;

    const isComplete = Boolean(props.data.source && props.data.target);
    const current = getValue(props.data) ?? fallback;
    const label = getLabel ? getLabel(current) : current;
    const nextValue = current === options[0] ? options[1] : options[0];

    return (
      <>
        <svg className="pointer-events-none absolute z-0 h-[9999px] w-[9999px] overflow-visible">
          {/* FIX(bug): the [animation:dash_1s_linear_infinite] utility references the `dash` keyframes that are only defined inside CustomConnectionView's styled-components block, which is injected only after a CustomConnectionView mounts — fix: define `@keyframes dash` in global CSS so this view does not depend on a sibling component mounting first; why: a graph containing only toggle connections renders them without the marching-ants animation. */}
          <path
            d={path}
            ref={pathRef}
            style={{ animationDelay }}
            className="pointer-events-auto fill-none stroke-[5] stroke-zinc-400 [stroke-dasharray:10_5] [stroke-dashoffset:45] [animation:dash_1s_linear_infinite]"
          />
        </svg>

        {isComplete && mid && (
          <BooleanConnectionToggle
            x={mid.x}
            y={mid.y}
            label={label}
            onToggle={() => {
              setValue(props.data, nextValue);
              refreshConnection(props.data.id);
            }}
          />
        )}
      </>
    );
  };
}
