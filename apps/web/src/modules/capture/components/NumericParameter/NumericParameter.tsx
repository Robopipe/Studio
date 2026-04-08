import { Slider } from "@/modules/shadcn/ui/slider";
import { Info } from "lucide-react";
import { useEffect, useState } from "react";
import { ZodNumber, ZodOptional } from "zod";

export interface NumericParameterProps {
  value: number | null;
  schema: ZodOptional<ZodNumber>;
  step: number;
  label: string;
  onValueChange: (value: number) => void;
}

const formatValue = (value: number) => {
  const absValue = Math.abs(value);
  // handle 1M
  if (absValue >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }

  // handle 1k
  if (absValue >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  return value.toFixed(0);
};

export const NumericParameter = ({
  value,
  schema,
  step,
  label,
  onValueChange,
}: NumericParameterProps) => {
  const [internalValue, setInternalValue] = useState(() => value);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  if (internalValue === null) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Info className="size-4 text-black/[0.38]" />
      <span className="w-[150px] overflow-hidden text-ellipsis whitespace-nowrap">
        {label}
      </span>
      <span className="w-[50px] overflow-hidden text-ellipsis whitespace-nowrap text-right">
        {formatValue(internalValue)}
      </span>

      <Slider
        value={[internalValue]}
        min={schema.unwrap().minValue ?? undefined}
        max={schema.unwrap().maxValue ?? undefined}
        step={step}
        onValueChange={(values) => {
          const next = values[0];
          if (next === undefined) return;
          setInternalValue(next);
          onValueChange(next);
        }}
      />
    </div>
  );
};
