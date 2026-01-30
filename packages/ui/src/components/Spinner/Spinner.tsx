import clsx from "clsx";
import { forwardRef, HTMLAttributes } from "react";
import { PaletteColor } from "../../types";
import styles from "./Spinner.module.scss";

export type SpinnerSize = "sm" | "md" | "lg";

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: SpinnerSize;
  color?: PaletteColor;
}

export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ size = "md", color = "primary", className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(styles.spinner, styles[`spinner--${size}`], className)}
        role="status"
        aria-label="Loading"
        {...props}
      >
        <div
          className={styles.spinner__circle}
          style={{
            borderRightColor: "transparent",
            borderTopColor: `var(--color-${color})`,
            borderLeftColor: `var(--color-${color})`,
            borderBottomColor: `var(--color-${color})`,
          }}
        />
      </div>
    );
  },
);

Spinner.displayName = "Spinner";
