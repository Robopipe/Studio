import { DashboardConfigurationZoneDirectionEnum } from "@repo/schema";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  type LucideIcon,
} from "lucide-react";
import React from "react";

export const isHorizontalStrip = (
  direction: DashboardConfigurationZoneDirectionEnum,
): boolean =>
  direction === DashboardConfigurationZoneDirectionEnum.TOP_TO_BOTTOM ||
  direction === DashboardConfigurationZoneDirectionEnum.BOTTOM_TO_TOP;

export const getZoneStyle = (
  direction: DashboardConfigurationZoneDirectionEnum,
  centerPct: number,
  thicknessPct: number,
): React.CSSProperties => {
  const base: React.CSSProperties = {
    position: "absolute",
    background: "rgba(239, 68, 68, 0.35)",
    border: "1px solid #ef4444",
    boxShadow: "0 0 0 1px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.2)",
    pointerEvents: "none",
  };

  if (isHorizontalStrip(direction)) {
    return {
      ...base,
      left: 0,
      width: "100%",
      top: `${centerPct - thicknessPct / 2}%`,
      height: `${thicknessPct}%`,
    };
  }

  return {
    ...base,
    top: 0,
    height: "100%",
    left: `${centerPct - thicknessPct / 2}%`,
    width: `${thicknessPct}%`,
  };
};

const arrowIconForDirection: Record<
  DashboardConfigurationZoneDirectionEnum,
  LucideIcon
> = {
  [DashboardConfigurationZoneDirectionEnum.LEFT_TO_RIGHT]: ArrowRight,
  [DashboardConfigurationZoneDirectionEnum.RIGHT_TO_LEFT]: ArrowLeft,
  [DashboardConfigurationZoneDirectionEnum.TOP_TO_BOTTOM]: ArrowDown,
  [DashboardConfigurationZoneDirectionEnum.BOTTOM_TO_TOP]: ArrowUp,
};

export const ZoneArrow = ({
  direction,
  centerPct,
}: {
  direction: DashboardConfigurationZoneDirectionEnum;
  centerPct: number;
}) => {
  const Icon = arrowIconForDirection[direction];
  const horizontal = isHorizontalStrip(direction);
  const style: React.CSSProperties = {
    position: "absolute",
    top: horizontal ? `${centerPct}%` : "50%",
    left: horizontal ? "50%" : `${centerPct}%`,
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
    filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.6))",
  };
  return (
    <Icon
      className="size-8 text-white"
      strokeWidth={2.5}
      style={style}
      aria-hidden
    />
  );
};

export { arrowIconForDirection };
