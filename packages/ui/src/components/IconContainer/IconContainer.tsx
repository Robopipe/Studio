import clsx from "clsx";
import { ComponentPropsWithRef, forwardRef, ReactNode } from "react";
import styles from "./IconContainer.module.scss";

export interface IconContainerProps extends ComponentPropsWithRef<"div"> {
  children: ReactNode;
  color: "neutral" | "success" | "dark" | "danger";
}

export const IconContainer = forwardRef<HTMLDivElement, IconContainerProps>(
  ({ children, color, className, ...restProps }: IconContainerProps, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          styles.iconContainer,
          styles[`iconContainer--${color}`],
          className,
        )}
        {...restProps}
      >
        <div
          className={clsx(
            styles.iconContainer__halo,
            styles[`iconContainer__halo--${color}`],
          )}
        >
          {children}
        </div>
      </div>
    );
  },
);

IconContainer.displayName = "IconContainer";
