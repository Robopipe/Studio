import { type Model, type ModelLog, ProjectTypeEnum } from "@repo/schema";

// Raw metric keys for mAP@50 per task type, ordered by backend preference. The
// first key that resolves to a finite number wins per epoch.
//   - Ultralytics ([B]/[M] suffix) — apps/ml-yolo
//   - luxonis-train (head/submetric path) — apps/ml; submetrics log under their
//     bare name (e.g. `map_50`, `segm_map_50`), NOT prefixed by the metric class.
//
// mAP@50:95 is read straight from `log.metrics.accuracy`: both backends
// canonicalize that value (Ultralytics → mAP50-95(B/M), luxonis → main
// MeanAveragePrecision), so it doesn't need raw-key probing.
const MAP50_KEYS: Partial<Record<ProjectTypeEnum, readonly string[]>> = {
  [ProjectTypeEnum.DETECTION]: [
    "metrics/mAP50(B)",
    "val/metric/EfficientBBoxHead/map_50",
  ],
  [ProjectTypeEnum.SEGMENTATION]: [
    "metrics/mAP50(M)",
    "val/metric/PrecisionSegmentBBoxHead/segm_map_50",
  ],
};

export const MAP50_SERIES_KEY = "map50";
export const MAP50_95_SERIES_KEY = "map50_95";
export const ACCURACY_SERIES_KEY = "accuracy";

export const getHeadlineLabel = (trainingType: ProjectTypeEnum): string =>
  MAP50_KEYS[trainingType] ? "mAP@50" : "Accuracy";

const pickFirstNumber = (
  metrics: Record<string, unknown>,
  keys: readonly string[],
): number | undefined => {
  for (const key of keys) {
    const raw = metrics[key];
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  }
  return undefined;
};

export interface HeadlineSeriesPoint {
  epoch: number;
  [key: string]: number | undefined;
}

export const headlineDualSeries = (
  logs: ModelLog[] | undefined,
  trainingType: ProjectTypeEnum,
): HeadlineSeriesPoint[] => {
  const map50Keys = MAP50_KEYS[trainingType];

  return (logs ?? []).flatMap<HeadlineSeriesPoint>((log) => {
    const point: HeadlineSeriesPoint = { epoch: log.epoch };

    if (map50Keys) {
      const map50 = pickFirstNumber(
        log.metrics as Record<string, unknown>,
        map50Keys,
      );
      const map5095 = Number.isFinite(log.metrics.accuracy)
        ? log.metrics.accuracy
        : undefined;
      if (map50 === undefined && map5095 === undefined) return [];
      if (map50 !== undefined) point[MAP50_SERIES_KEY] = map50;
      if (map5095 !== undefined) point[MAP50_95_SERIES_KEY] = map5095;
      return [point];
    }

    if (Number.isFinite(log.metrics.accuracy)) {
      point[ACCURACY_SERIES_KEY] = log.metrics.accuracy;
      return [point];
    }
    return [];
  });
};

export interface HeadlineSeriesDescriptor {
  key: string;
  label: string;
}

export const headlineSeriesConfig = (
  trainingType: ProjectTypeEnum,
): HeadlineSeriesDescriptor[] =>
  MAP50_KEYS[trainingType]
    ? [
        { key: MAP50_SERIES_KEY, label: "mAP@50" },
        { key: MAP50_95_SERIES_KEY, label: "mAP@50:95" },
      ]
    : [{ key: ACCURACY_SERIES_KEY, label: "Accuracy" }];

/**
 * Headline value for a model card. Reads pre-computed columns instead of
 * fetching logs:
 *   - det/seg: `bestMap50` (max mAP@50 across epochs, written by ml-yolo)
 *   - cls:     `finalAccuracy` (last-epoch top-1; cls has no mAP)
 */
export const getHeadlineValue = (model: Model): number | null => {
  if (MAP50_KEYS[model.trainingType]) return model.bestMap50;
  return model.finalAccuracy;
};
