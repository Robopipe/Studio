import { BooleanConnectionToggle } from "@/modules/evaluation/graph/editor/ui/components/BooleanConnectionToggle";
import { useLayoutEffect, useRef, useState } from "react";
import type { ClassicScheme } from "rete-react-plugin";
import { Presets } from "rete-react-plugin";
import { CONNECTION_PATH_CLASS, CONNECTION_SVG_CLASS } from "./connectionStyles";

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
  return function ToggleConnectionView(props: { data: C }) {
    const { path } = useConnection();
    const pathRef = useRef<SVGPathElement | null>(null);
    const [mid, setMid] = useState<{ x: number; y: number } | null>(null);
    const [animationDelay] = useState(() => `-${performance.now() % 1000}ms`);

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
        <svg className={CONNECTION_SVG_CLASS}>
          <path
            d={path}
            ref={pathRef}
            style={{ animationDelay }}
            className={CONNECTION_PATH_CLASS}
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
