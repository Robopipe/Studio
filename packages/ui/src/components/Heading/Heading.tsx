import clsx from "clsx";
import { ComponentPropsWithoutRef, forwardRef, ReactNode } from "react";
import { TextColor } from "../../types";
import styles from "./Heading.module.scss";

export type HeadingVariant = "h1" | "h2" | "h3" | "h4" | "h5";
export type HeadingWeight = "500" | "600" | "700";

export interface HeadingProps extends ComponentPropsWithoutRef<HeadingVariant> {
  children: ReactNode;
  variant?: HeadingVariant;
  weight?: HeadingWeight;
  color?: TextColor;
}

export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(
  (props: HeadingProps, ref) => {
    const {
      children,
      variant = "h2",
      weight = "700",
      color,
      style,
      className,
      ...rest
    } = props;
    const Component = variant;

    return (
      <Component
        ref={ref}
        className={clsx(
          styles.heading,
          styles[`heading--${variant}--${weight}`],
          className,
        )}
        style={{ ...style, color: color ? `var(--color-${color})` : undefined }}
        {...rest}
      >
        {children}
      </Component>
    );
  },
);

Heading.displayName = "Heading";
