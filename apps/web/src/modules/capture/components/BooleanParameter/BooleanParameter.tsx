import { useEffect, useState } from "react";

import { InformationIcon, Switch } from "@repo/ui";
import styles from "./BooleanParameter.module.scss";

export interface BooleanParameterProps {
  value: boolean | null;
  label: string;
  onValueChange: (value: boolean) => void;
}

export const BooleanParameter = ({
  value,
  label,
  onValueChange,
}: BooleanParameterProps) => {
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

      <Switch
        checked={internalValue}
        onCheckedChange={(value) => {
          setInternalValue(value);
          onValueChange(value);
        }}
      />
    </div>
  );
};
