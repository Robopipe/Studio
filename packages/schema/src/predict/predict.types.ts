import z from "zod";
import {
  mlInferDetectRequestSchema,
  mlInferDetectResponseSchema,
  mlInferDetectedRectangleSchema,
  mlInferPredictRequestSchema,
  mlInferPredictResponseSchema,
  mlInferPredictedPolygonSchema,
  predictRequestSchema,
  predictResponseSchema,
  predictedPolygonSchema,
  predictedRectangleSchema,
} from "./predict.schema";

export type PredictRequest = z.infer<typeof predictRequestSchema>;
export type PredictedPolygon = z.infer<typeof predictedPolygonSchema>;
export type PredictedRectangle = z.infer<typeof predictedRectangleSchema>;
export type PredictResponse = z.infer<typeof predictResponseSchema>;

export type MlInferPredictRequest = z.infer<typeof mlInferPredictRequestSchema>;
export type MlInferPredictedPolygon = z.infer<typeof mlInferPredictedPolygonSchema>;
export type MlInferPredictResponse = z.infer<typeof mlInferPredictResponseSchema>;

export type MlInferDetectRequest = z.infer<typeof mlInferDetectRequestSchema>;
export type MlInferDetectedRectangle = z.infer<typeof mlInferDetectedRectangleSchema>;
export type MlInferDetectResponse = z.infer<typeof mlInferDetectResponseSchema>;
