import {
  Switch as BaseSwitch,
  SwitchRootProps as BaseSwitchProps,
  Field,
} from "@base-ui/react";
import { ReactNode } from "react";
import styles from "./Switch.module.scss";

export interface SwitchProps extends BaseSwitchProps {
  label?: ReactNode;
}

export const Switch = ({ label, ...restProps }: SwitchProps) => {
  return (
    <Field.Root>
      <Field.Label className={styles.Label}>
        <BaseSwitch.Root {...restProps} className={styles.Switch}>
          <BaseSwitch.Thumb className={styles.Thumb} />
        </BaseSwitch.Root>
        {label}
      </Field.Label>
    </Field.Root>
  );
};
