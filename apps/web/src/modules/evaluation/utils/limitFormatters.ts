import { EvalLimitItemEdgeEnum, EvalLimitItemQuantifierTypeEnum } from "@repo/schema";

export const quantifierTypeLabel: Record<EvalLimitItemQuantifierTypeEnum, string> = {
  [EvalLimitItemQuantifierTypeEnum.MIN]: "At least",
  [EvalLimitItemQuantifierTypeEnum.MAX]: "At most",
  [EvalLimitItemQuantifierTypeEnum.EXACT]: "Exactly",
};

export const parameterLabel: Record<string, string> = {
  POSITION: "Position",
  AREA: "Area",
  COUNT: "Count",
};

export const parameterUnit: Record<string, string> = {
  COUNT: "pcs",
  AREA: "%",
  POSITION: "%",
};

export const edgeLabel: Record<EvalLimitItemEdgeEnum, string> = {
  [EvalLimitItemEdgeEnum.LEFT]: "Left",
  [EvalLimitItemEdgeEnum.RIGHT]: "Right",
  [EvalLimitItemEdgeEnum.TOP]: "Top",
  [EvalLimitItemEdgeEnum.BOTTOM]: "Bottom",
  [EvalLimitItemEdgeEnum.CENTER]: "Center",
};

export function formatLimitValue(
  value: number | null,
  parameter: string,
): string {
  if (value === null) return "-";
  const unit = parameterUnit[parameter] ?? "";
  return `${value} ${unit}`.trim();
}
