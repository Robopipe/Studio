import {
  Input as BaseInput,
  InputProps as BaseInputProps,
} from "@base-ui/react/input";

import { bui } from "@repo/ui";
import clsx from "clsx";
import { useState } from "react";
import { InvisibleIcon, VisibleIcon } from "../../icons";
import styles from "./TextInput.module.scss";

export interface TextInputProps extends BaseInputProps {
  label: string;
  boldLabel?: boolean;
  helperText?: string;
  error?: boolean;
}

export const TextInput = (props: TextInputProps) => {
  const { label, boldLabel, type, helperText, error, className, id, ...rest } = props;
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <bui.Field.Root>
      <div className={styles.FieldRoot}>
        <label htmlFor={id} className={clsx(styles.Label, boldLabel && styles.LabelBold)}>
          {label}
        </label>

        <div className={styles.InputWrapper}>
          <BaseInput
            id={id}
            className={clsx(
              styles.Input,
              isPassword && styles.InputWithIcon,
              error && styles.InputError,
              className,
            )}
            type={inputType}
            {...rest}
          />

          {isPassword && (
            <button
              type="button"
              className={styles.IconButton}
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <InvisibleIcon /> : <VisibleIcon />}
            </button>
          )}
        </div>

        {helperText && (
          <span
            className={clsx(styles.HelperText, error && styles.HelperError)}
          >
            {helperText}
          </span>
        )}
      </div>
    </bui.Field.Root>
  );
};
