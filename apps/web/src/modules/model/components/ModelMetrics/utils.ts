import type { Label } from "@repo/schema";

export const lastSegment = (key: string): string => {
  const parts = key.split("/");
  return parts[parts.length - 1] ?? key;
};

export const headFromKey = (key: string): string => key.split("/")[0] ?? key;

/**
 * Friendly names for metric base keys luxonis-train emits, so tab headers
 * don't look like raw snake_case strings.
 */
const TAB_LABEL_OVERRIDES: Record<string, string> = {
  map: "mAP",
  mar_100: "mAR@100",
  bbox_map: "Bbox mAP",
  bbox_mar_100: "Bbox mAR@100",
  segm_map: "Segm mAP",
  segm_mar_100: "Segm mAR@100",
  F1Score: "F1 Score",
};

export const toTabLabel = (baseKey: string): string => {
  let name = lastSegment(baseKey);
  name = name.replace(/_per_class$/, "");
  name = name.replace(/^Multiclass/, "");
  return TAB_LABEL_OVERRIDES[name] ?? name;
};

export const resolveLabelName = (
  labelId: string | null,
  labelsById: Map<number, Label>,
): string => {
  if (labelId === null) return "no match";
  const numeric = Number(labelId);
  if (Number.isNaN(numeric)) return labelId;
  return labelsById.get(numeric)?.name ?? `#${labelId}`;
};

export const formatPct = (value: number): string => {
  if (!Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
};

/**
 * Fallback palette used when a label doesn't have a DB color set. Index is
 * derived from the label's position in `model.labels`, so colors are stable
 * across epochs for a given project.
 */
export const FALLBACK_COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];
