import z from "zod";
import {
  mlInferPredictRequestSchema,
  mlInferPredictResponseSchema,
  mlInferPredictedPolygonSchema,
  predictRequestSchema,
  predictResponseSchema,
  predictedPolygonSchema,
} from "./predict.schema";

export type PredictRequest = z.infer<typeof predictRequestSchema>;
export type PredictedPolygon = z.infer<typeof predictedPolygonSchema>;
export type PredictResponse = z.infer<typeof predictResponseSchema>;

export type MlInferPredictRequest = z.infer<typeof mlInferPredictRequestSchema>;
export type MlInferPredictedPolygon = z.infer<typeof mlInferPredictedPolygonSchema>;
export type MlInferPredictResponse = z.infer<typeof mlInferPredictResponseSchema>;
