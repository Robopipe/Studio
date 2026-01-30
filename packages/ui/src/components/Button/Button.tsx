import { Button as BaseUIButton } from "@base-ui/react/button";
import clsx from "clsx";
import React, { ReactNode } from "react";
import styles from "./Button.module.scss";

export type ButtonVariant = "filled" | "outlined" | "text";
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonColor = "primary" | "gray";

export interface ButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  color?: ButtonColor;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  children?: ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "filled",
      size = "md",
      color = "primary",
      startIcon,
      endIcon,
      loading = false,
      fullWidth = false,
      disabled = false,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <BaseUIButton
        ref={ref}
        disabled={isDisabled}
        className={clsx(
          styles.button,
          styles[`button--${variant}`],
          styles[`button--${size}`],
          styles[`button--${color}`],
          {
            [styles["button--loading"]]: loading,
            [styles["button--full-width"]]: fullWidth,
          },
          className,
        )}
        {...props}
      >
        {loading ? (
          <>
            <span className={styles["button__spinner"]} aria-hidden="true" />
            {children && (
              <span className={styles["button__text"]}>{children}</span>
            )}
          </>
        ) : (
          <>
            {startIcon && (
              <span className={styles["button__icon--start"]}>{startIcon}</span>
            )}
            {children && (
              <span className={styles["button__text"]}>{children}</span>
            )}
            {endIcon && (
              <span className={styles["button__icon--end"]}>{endIcon}</span>
            )}
          </>
        )}
      </BaseUIButton>
    );
  },
);

Button.displayName = "Button";
