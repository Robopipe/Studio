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

export interface SafeBounds {
  safeStartPct: number;
  safeEndPct: number;
}

export const centerThicknessToSafeBounds = (
  centerPct: number,
  thicknessPct: number,
): SafeBounds => {
  const half = thicknessPct / 2;
  return {
    safeStartPct: centerPct - half,
    safeEndPct: 100 - (centerPct + half),
  };
};

export const safeBoundsToCenterThickness = (
  safeStartPct: number,
  safeEndPct: number,
): { centerPct: number; thicknessPct: number } => {
  const thicknessPct = 100 - safeStartPct - safeEndPct;
  const centerPct = safeStartPct + thicknessPct / 2;
  return { centerPct, thicknessPct };
};

export const safeZoneLabels = (
  direction: DashboardConfigurationZoneDirectionEnum,
): { start: string; end: string } =>
  isHorizontalStrip(direction)
    ? { start: "Safe from top", end: "Safe from bottom" }
    : { start: "Safe from left", end: "Safe from right" };

const safeZoneBaseStyle: React.CSSProperties = {
  position: "absolute",
  background: "rgba(239, 68, 68, 0.25)",
  pointerEvents: "none",
};

const innerDashed = "1px dashed #ef4444";

export const getSafeZoneStyles = (
  direction: DashboardConfigurationZoneDirectionEnum,
  safeStartPct: number,
  safeEndPct: number,
): { start: React.CSSProperties; end: React.CSSProperties } => {
  const start = Math.max(0, Math.min(100, safeStartPct));
  const end = Math.max(0, Math.min(100, safeEndPct));

  if (isHorizontalStrip(direction)) {
    return {
      start: {
        ...safeZoneBaseStyle,
        left: 0,
        width: "100%",
        top: 0,
        height: `${start}%`,
        borderBottom: start > 0 ? innerDashed : undefined,
      },
      end: {
        ...safeZoneBaseStyle,
        left: 0,
        width: "100%",
        bottom: 0,
        height: `${end}%`,
        borderTop: end > 0 ? innerDashed : undefined,
      },
    };
  }

  return {
    start: {
      ...safeZoneBaseStyle,
      top: 0,
      height: "100%",
      left: 0,
      width: `${start}%`,
      borderRight: start > 0 ? innerDashed : undefined,
    },
    end: {
      ...safeZoneBaseStyle,
      top: 0,
      height: "100%",
      right: 0,
      width: `${end}%`,
      borderLeft: end > 0 ? innerDashed : undefined,
    },
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
