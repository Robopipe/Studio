import { modelLogMetricsSchema } from "./model.schema";
import z from "zod";

export type ModelLogMetrics = z.infer<typeof modelLogMetricsSchema>
