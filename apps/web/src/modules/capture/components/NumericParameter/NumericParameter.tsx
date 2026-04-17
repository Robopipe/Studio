import { Slider } from "@/modules/shadcn/ui/slider";
import { Info } from "lucide-react";
import { useEffect, useState } from "react";

export interface NumericParameterProps {
  value: number | null;
  min: number;
  max: number;
  step?: number;
  label: string;
  disabled?: boolean;
  scale?: "linear" | "log";
  onValueChange: (value: number) => void;
}

const LOG_SLIDER_STEPS = 1000;

const formatValue = (value: number) => {
  const absValue = Math.abs(value);
  if (absValue >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (absValue >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k`;
  }
  if (Number.isInteger(value)) {
    return value.toFixed(0);
  }
  return value.toFixed(2);
};

const logMapping = (min: number, max: number) => {
  const logMin = Math.log(Math.max(min, 1));
  const logMax = Math.log(Math.max(max, logMin + 1));
  const span = logMax - logMin;
  return {
    toSlider: (value: number) => {
      const v = Math.max(value, 1);
      return Math.round(((Math.log(v) - logMin) / span) * LOG_SLIDER_STEPS);
    },
    fromSlider: (slider: number) =>
      Math.round(Math.exp(logMin + (slider / LOG_SLIDER_STEPS) * span)),
  };
};

export const NumericParameter = ({
  value,
  min,
  max,
  step,
  label,
  disabled,
  scale = "linear",
  onValueChange,
}: NumericParameterProps) => {
  const [internalValue, setInternalValue] = useState(() => value);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  if (internalValue === null) {
    return null;
  }

  const isLog = scale === "log";
  const log = isLog ? logMapping(min, max) : null;

  const sliderMin = isLog ? 0 : min;
  const sliderMax = isLog ? LOG_SLIDER_STEPS : max;
  const sliderStep = isLog ? 1 : step;
  const sliderValue = log ? log.toSlider(internalValue) : internalValue;

  return (
    <div className="flex items-center gap-2 text-xs leading-4">
      <Info className="size-4 shrink-0 text-foreground/40" />
      <span className="w-[110px] truncate text-foreground/90">{label}</span>
      <span className="w-10 shrink-0 text-right tabular-nums text-foreground/60">
        {formatValue(internalValue)}
      </span>
      <Slider
        className="flex-1"
        value={sliderValue}
        min={sliderMin}
        max={sliderMax}
        step={sliderStep}
        disabled={disabled}
        onValueChange={(next) => {
          const n =
            typeof next === "number"
              ? next
              : Array.isArray(next)
                ? next[0]
                : undefined;
          if (n === undefined) return;
          const actual = log ? log.fromSlider(n) : n;
          setInternalValue(actual);
          onValueChange(actual);
        }}
      />
    </div>
  );
};
