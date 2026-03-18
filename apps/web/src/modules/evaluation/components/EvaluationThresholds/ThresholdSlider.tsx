import { EvalThreshold } from "@repo/schema";
import { Pencil, Plus } from "lucide-react";
import { useCallback, useRef } from "react";


interface ThresholdSliderProps {
  thresholds: EvalThreshold[];
  onEditThreshold?: (threshold: EvalThreshold) => void;
  onAddThreshold?: () => void;
  onValueChange?: (thresholdId: string, newValue: number) => void;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function ThresholdSlider({
  thresholds,
  onEditThreshold,
  onAddThreshold,
  onValueChange,
}: ThresholdSliderProps) {
  const sorted = [...thresholds].sort((a, b) => a.value - b.value);
  const barRef = useRef<HTMLDivElement>(null);

  const getPercentFromPointer = useCallback(
    (clientX: number): number => {
      const bar = barRef.current;
      if (!bar) return 0;
      const rect = bar.getBoundingClientRect();
      return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    },
    [],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, thresholdId: string, idx: number) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      const minValue = idx > 0 ? sorted[idx - 1].value + 0.01 : 0.01;
      const maxValue =
        idx < sorted.length - 1 ? sorted[idx + 1].value - 0.01 : 0.99;

      const onPointerMove = (moveEvent: PointerEvent) => {
        const rawValue = getPercentFromPointer(moveEvent.clientX);
        const clamped = Math.max(minValue, Math.min(maxValue, rawValue));
        const rounded = Math.round(clamped * 100) / 100;
        onValueChange?.(thresholdId, rounded);
      };

      const onPointerUp = () => {
        document.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerup", onPointerUp);
      };

      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
    },
    [sorted, getPercentFromPointer, onValueChange],
  );

  return (
    <div className="flex flex-1 items-center gap-9">
      <div className="flex flex-1 flex-col gap-2">
        {/* Labels row */}
        <div className="flex items-start">
          {sorted.map((threshold, idx) => {
            const prevValue = idx > 0 ? sorted[idx - 1].value : 0;
            const isFirst = idx === 0;
            const isLast = idx === sorted.length - 1;

            return (
              <div
                key={threshold.id}
                className="flex items-center justify-center gap-2"
                style={
                  isLast
                    ? { flex: "1 0 0" }
                    : { width: `${(threshold.value - prevValue) * 100}%` }
                }
              >
                <div className="flex flex-col items-start text-xs text-foreground whitespace-nowrap">
                  <span className="font-normal leading-4">
                    {threshold.name}
                  </span>
                  <span className="font-bold leading-4">
                    {isFirst && "<"}
                    {!isFirst && !isLast &&
                      `${formatPercent(prevValue)} - `}
                    {isLast && ">"}
                    {isLast
                      ? formatPercent(prevValue)
                      : formatPercent(threshold.value)}
                  </span>
                </div>
                <button
                  type="button"
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => onEditThreshold?.(threshold)}
                >
                  <Pencil className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Slider bar */}
        <div
          ref={barRef}
          className="relative flex h-3 w-full items-center rounded-full bg-muted"
        >
          {sorted.map((threshold, idx) => {
            const prevValue = idx > 0 ? sorted[idx - 1].value : 0;
            const isLast = idx === sorted.length - 1;

            return (
              <div
                key={threshold.id}
                className="relative h-3 rounded-full"
                style={{
                  ...(isLast
                    ? { flex: "1 0 0" }
                    : { width: `${(threshold.value - prevValue) * 100}%` }),
                  backgroundColor: threshold.color,
                  zIndex: sorted.length - idx,
                }}
              >
                {!isLast && (
                  <div
                    className="absolute -right-2 -top-0.5 size-4 cursor-grab rounded-full border-2 border-white bg-gray-600 shadow-sm active:cursor-grabbing"
                    onPointerDown={(e) =>
                      handlePointerDown(e, threshold.id, idx)
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        onClick={onAddThreshold}
      >
        <Plus className="size-6" />
      </button>
    </div>
  );
}
