import clsx from "clsx";
import { ReactNode } from "react";
import { Text } from "../Text";
import styles from "./Badge.module.scss";

export type BadgeVariant = "neutral" | "success" | "error";
export interface BadgeProps {
  variant?: BadgeVariant;
  children?: ReactNode;
}

export const Badge = ({ variant, children }: BadgeProps) => {
  return (
    <div
      className={clsx(styles.badge, styles[`badge--${variant || "neutral"}`])}
    >
      <Text variant="number-12">{children}</Text>
    </div>
  );
};
