import z from "zod";
import {
  analyticsDatasetStatsQuerySchema,
  analyticsDatasetStatsSchema,
  annotationAvailableTypesSchema,
  annotationBoxStatsSchema,
  annotationLabelStatSchema,
  annotationTypeEnum,
} from "./analytics.schema";

export type AnnotationType = z.infer<typeof annotationTypeEnum>;
export type AnnotationBoxStats = z.infer<typeof annotationBoxStatsSchema>;
export type AnnotationLabelStat = z.infer<typeof annotationLabelStatSchema>;
export type AnnotationAvailableTypes = z.infer<typeof annotationAvailableTypesSchema>;
export type AnalyticsDatasetStats = z.infer<typeof analyticsDatasetStatsSchema>;
export type AnalyticsDatasetStatsQuery = z.infer<typeof analyticsDatasetStatsQuerySchema>;
