import z from "zod";
import {
  createModelSchema,
  modelLogMetricsSchema,
  modelLogSchema,
  modelSchema,
} from "./model.schema";

export type ModelLogMetrics = z.infer<typeof modelLogMetricsSchema>;
export type ModelLog = z.infer<typeof modelLogSchema>;
export type Model = z.infer<typeof modelSchema>;
export type CreateModel = z.infer<typeof createModelSchema>;
