import clsx from "clsx";
import { ComponentPropsWithoutRef, forwardRef, ReactNode } from "react";
import { TextColor } from "../../types";
import styles from "./Text.module.scss";

type TextSize = "10" | "12" | "14" | "16" | "20";
type TextStyle = "text" | "code" | "number";

export type TextVariant = `${TextStyle}-${TextSize}`;
export type TextWeight = "400" | "500" | "700";

export interface TextProps extends ComponentPropsWithoutRef<"span"> {
  variant?: TextVariant;
  weight?: TextWeight;
  color?: TextColor;
  as?: "span" | "p" | "div" | "label";
  children?: ReactNode;
}

export const Text = forwardRef<HTMLElement, TextProps>(
  (
    {
      className,
      variant = "text-16",
      weight = "400",
      color,
      as = "span",
      style,
      children,
      ...props
    },
    ref,
  ) => {
    console.log(styles[`text--text-20`]);
    const Component = as;

    return (
      <Component
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref={ref as any}
        className={clsx(
          styles.text,
          styles[`text--${variant}`],
          styles[`text--${weight}`],
          className,
        )}
        style={{ ...style, color: color ? `var(--color-${color})` : undefined }}
        {...props}
      >
        {children}
      </Component>
    );
  },
);

Text.displayName = "Text";
