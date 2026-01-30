import clsx from "clsx";
import React, { ReactNode } from "react";
import styles from "./Container.module.scss";

export type ContainerSize = "sm" | "md" | "lg" | "xl" | "2xl" | "full";
export type ContainerPadding = "none" | "sm" | "md" | "lg" | "xl";

export interface ContainerProps extends React.ComponentPropsWithoutRef<"div"> {
  children?: ReactNode;
  size?: ContainerSize;
  paddingX?: ContainerPadding;
  paddingY?: ContainerPadding;
  centered?: boolean;
  as?: React.ElementType;
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  (
    {
      children,
      className,
      size = "lg",
      paddingX = "md",
      paddingY = "md",
      centered = true,
      as: Component = "div",
      ...props
    },
    ref,
  ) => {
    return (
      <Component
        ref={ref}
        className={clsx(
          styles.container,
          styles[`container--size-${size}`],
          styles[`container--padding-x-${paddingX}`],
          styles[`container--padding-y-${paddingY}`],
          {
            [styles["container--centered"]]: centered,
          },
          className,
        )}
        {...props}
      >
        {children}
      </Component>
    );
  },
);

Container.displayName = "Container";
