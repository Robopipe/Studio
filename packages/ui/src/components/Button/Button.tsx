import {
  Button as BaseButton,
  ButtonProps as BaseButtonProps,
} from "@base-ui/react";
import clsx from "clsx";
import { ReactNode } from "react";
import styles from "./Button.module.scss";

export type ButtonVariant = "filled" | "outlined" | "text" | "danger";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

export interface ButtonProps extends BaseButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
}

export const Button = (props: ButtonProps) => {
  const {
    className,
    children,
    variant = "filled",
    size = "md",
    fullWidth,
    iconStart,
    iconEnd,
    ...rest
  } = props;
  return (
    <BaseButton
      className={clsx(
        styles.button,
        styles[`button--${variant}`],
        styles[`button--${size}`],
        fullWidth && styles["button--fullWidth"],
        className,
      )}
      {...rest}
    >
      {iconStart && <span className={styles.button__icon}>{iconStart}</span>}
      {children}
      {iconEnd && <span className={styles.button__icon}>{iconEnd}</span>}
    </BaseButton>
  );
};
