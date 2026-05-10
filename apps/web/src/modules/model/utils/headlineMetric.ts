import { type ModelLog, ProjectTypeEnum } from "@repo/schema";

// Ultralytics raw metric key for mAP@0.5 per task type. Classification has no
// mAP, so we fall back to the canonical `accuracy` (which is top-1 for cls).
// `metrics` is a `.loose()` object — declared at the schema level only with
// `accuracy`/`loss`, but Ultralytics forwards every raw key it produces.
const MAP50_KEY: Partial<Record<ProjectTypeEnum, string>> = {
  [ProjectTypeEnum.DETECTION]: "metrics/mAP50(B)",
  [ProjectTypeEnum.SEGMENTATION]: "metrics/mAP50(M)",
};

export const getHeadlineLabel = (trainingType: ProjectTypeEnum): string =>
  MAP50_KEY[trainingType] ? "mAP@50" : "Accuracy";

const pickHeadlineValue = (
  log: ModelLog,
  trainingType: ProjectTypeEnum,
): number | undefined => {
  const key = MAP50_KEY[trainingType];
  if (key) {
    // Legacy luxonis-train runs don't emit mAP50 — show nothing rather than
    // fall back to mAP50-95 mislabelled as mAP50.
    const raw = (log.metrics as Record<string, unknown>)[key];
    return typeof raw === "number" && Number.isFinite(raw) ? raw : undefined;
  }
  return Number.isFinite(log.metrics.accuracy)
    ? log.metrics.accuracy
    : undefined;
};

export const headlineSeries = (
  logs: ModelLog[] | undefined,
  trainingType: ProjectTypeEnum,
): { epoch: number; value: number }[] =>
  (logs ?? []).flatMap((log) => {
    const value = pickHeadlineValue(log, trainingType);
    return value === undefined ? [] : [{ epoch: log.epoch, value }];
  });

export const bestHeadline = (
  logs: ModelLog[] | undefined,
  trainingType: ProjectTypeEnum,
): number | undefined => {
  let best: number | undefined;
  for (const log of logs ?? []) {
    const v = pickHeadlineValue(log, trainingType);
    if (v === undefined) continue;
    if (best === undefined || v > best) best = v;
  }
  return best;
};
