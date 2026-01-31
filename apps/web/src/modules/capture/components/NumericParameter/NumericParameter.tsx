import { Slider } from "@repo/ui/components/Slider/Slider";
import { useEffect, useState } from "react";
import { ZodNumber, ZodOptional } from "zod";

import { InformationIcon } from "@repo/ui";
import styles from "./NumericParameter.module.scss";

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
    <div className={styles.parameter}>
      <InformationIcon className={styles.infoIcon} />
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{formatValue(internalValue)}</span>

      <Slider
        value={internalValue}
        min={schema.unwrap().minValue ?? undefined}
        max={schema.unwrap().maxValue ?? undefined}
        step={step}
        onValueChange={(value) => {
          setInternalValue(value as number);
          onValueChange(value as number);
        }}
      />
    </div>
  );
};
