import { EvalLimitItemQuantifierTypeEnum } from "@repo/schema";

export const quantifierTypeLabel: Record<EvalLimitItemQuantifierTypeEnum, string> = {
  [EvalLimitItemQuantifierTypeEnum.MIN]: "At least",
  [EvalLimitItemQuantifierTypeEnum.MAX]: "At most",
  [EvalLimitItemQuantifierTypeEnum.EXACT]: "Exactly",
};

export const parameterLabel: Record<string, string> = {
  POS_LEFT: "Position Left",
  POS_RIGHT: "Position Right",
  POS_TOP: "Position Top",
  POS_BOTTOM: "Position Bottom",
  POS_CENTER: "Position Center",
  AREA: "Area",
  COUNT: "Count",
};

export const parameterUnit: Record<string, string> = {
  COUNT: "pcs",
  AREA: "%",
  POS_LEFT: "%",
  POS_RIGHT: "%",
  POS_TOP: "%",
  POS_BOTTOM: "%",
  POS_CENTER: "%",
};

export function formatLimitValue(
  value: number | null,
  parameter: string,
): string {
  if (value === null) return "-";
  const unit = parameterUnit[parameter] ?? "";
  return `${value} ${unit}`.trim();
}
