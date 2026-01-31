import clsx from "clsx";
import {
  ComponentPropsWithoutRef,
  CSSProperties,
  ElementType,
  forwardRef,
  ReactNode,
} from "react";
import styles from "./Stack.module.scss";

export type StackDirection =
  | "row"
  | "column"
  | "row-reverse"
  | "column-reverse";
export type StackAlign = "start" | "center" | "end" | "stretch" | "baseline";
export type StackJustify =
  | "start"
  | "center"
  | "end"
  | "space-between"
  | "space-around"
  | "space-evenly";
export type StackGap = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export type StackWrap = "wrap" | "nowrap" | "wrap-reverse";

export interface StackProps extends ComponentPropsWithoutRef<"div"> {
  children?: ReactNode;
  direction?: StackDirection;
  align?: StackAlign;
  justify?: StackJustify;
  gap?: StackGap | string | number;
  wrap?: StackWrap;
  fullWidth?: boolean;
  fullHeight?: boolean;
  as?: ElementType;
}

export const Stack = forwardRef<HTMLDivElement, StackProps>(
  (
    {
      children,
      className,
      direction = "column",
      align,
      justify,
      gap = "md",
      wrap,
      fullWidth = false,
      fullHeight = false,
      as: Component = "div",
      style,
      ...props
    },
    ref,
  ) => {
    // Check if gap is a preset or custom value
    const isPresetGap = ["xs", "sm", "md", "lg", "xl", "2xl"].includes(
      gap as string,
    );

    const customStyles: CSSProperties = {
      ...style,
    };

    // If gap is a custom value (not a preset), apply it as inline style
    if (!isPresetGap) {
      customStyles.gap = typeof gap === "number" ? `${gap}px` : gap;
    }

    return (
      <Component
        ref={ref}
        className={clsx(
          styles.stack,
          styles[`stack--direction-${direction}`],
          isPresetGap && styles[`stack--gap-${gap}`],
          align && styles[`stack--align-${align}`],
          justify && styles[`stack--justify-${justify}`],
          wrap && styles[`stack--wrap-${wrap}`],
          {
            [styles["stack--full-width"]]: fullWidth,
            [styles["stack--full-height"]]: fullHeight,
          },
          className,
        )}
        style={customStyles}
        {...props}
      >
        {children}
      </Component>
    );
  },
);

Stack.displayName = "Stack";
