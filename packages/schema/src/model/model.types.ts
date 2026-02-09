import z from "zod";
import {
  createModelSchema,
  modelAugmentationSchema,
  modelLogMetricsSchema,
  modelLogSchema,
  modelOutputSchema,
  modelSchema,
} from "./model.schema";

export type ModelLogMetrics = z.infer<typeof modelLogMetricsSchema>;
export type ModelLog = z.infer<typeof modelLogSchema>;
export type ModelAugmentation = z.infer<typeof modelAugmentationSchema>;
export type Model = z.infer<typeof modelSchema>;
export type CreateModel = z.infer<typeof createModelSchema>;
export type ModelOutput = z.infer<typeof modelOutputSchema>;
