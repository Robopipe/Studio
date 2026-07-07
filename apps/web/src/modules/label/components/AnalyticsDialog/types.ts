import { AnalyticsDatasetStats, AnnotationType } from "@repo/schema";

export type LabelEntry = AnalyticsDatasetStats["labels"][number];

export const ALL_TYPES: AnnotationType[] = [
  "rectangle",
  "polygon",
  "classification",
];
