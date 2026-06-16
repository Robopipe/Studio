import z from "zod";
import { PreAnnotateModelTypeEnum } from "../preAnnotateSettings/preAnnotateSettings.schema";

/**
 * Body of POST /v1/projects/:projectId/tasks/:taskId/predict.
 * The model is project-scoped; the API verifies the model belongs to the
 * same project before invoking ml-infer.
 */
export const predictRequestSchema = z.discriminatedUnion("modelType", [
  z.object({
    modelType: z.literal(PreAnnotateModelTypeEnum.SEGMENTATION),
    modelId: z.number().int().positive(),
    conf: z.number().min(0).max(1).optional(),
    iou: z.number().min(0).max(1).optional(),
    polyEpsilon: z.number().min(0).max(0.05).optional(),
    maskThreshold: z.number().min(0).max(1).optional(),
    minAreaPx: z.number().min(0).max(10000).optional(),
    fillConcavityLabelIds: z.number().int().positive().array().optional(),
  }),
  z.object({
    modelType: z.literal(PreAnnotateModelTypeEnum.DETECTION),
    modelId: z.number().int().positive(),
    conf: z.number().min(0).max(1).optional(),
    iou: z.number().min(0).max(1).optional(),
    minAreaPx: z.number().min(0).max(10000).optional(),
  }),
]);

export const predictedPolygonSchema = z.object({
  labelId: z.number().int().positive(),
  score: z.number().min(0).max(1),
  value: z.tuple([z.number(), z.number()]).array(),
});

export const predictedRectangleSchema = z.object({
  labelId: z.number().int().positive(),
  score: z.number().min(0).max(1),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

export const predictResponseSchema = z.discriminatedUnion("modelType", [
  z.object({
    modelType: z.literal(PreAnnotateModelTypeEnum.SEGMENTATION),
    polygons: predictedPolygonSchema.array(),
  }),
  z.object({
    modelType: z.literal(PreAnnotateModelTypeEnum.DETECTION),
    rectangles: predictedRectangleSchema.array(),
  }),
]);

/**
 * Internal contract between apps/api and apps/ml-infer (segmentation).
 */
export const mlInferPredictRequestSchema = z.object({
  imageUrl: z.string().url(),
  modelUrl: z.string().url(),
  modelId: z.number().int().positive(),
  conf: z.number().min(0).max(1).optional(),
  iou: z.number().min(0).max(1).optional(),
  polyEpsilon: z.number().min(0).max(0.05).optional(),
  maskThreshold: z.number().min(0).max(1).optional(),
  minAreaPx: z.number().min(0).max(10000).optional(),
  fillConcavityClasses: z.number().int().min(0).array().optional(),
  maxDet: z.number().int().min(1).max(10000).optional(),
});

export const mlInferPredictedPolygonSchema = z.object({
  classIndex: z.number().int().min(0),
  score: z.number().min(0).max(1),
  value: z.tuple([z.number(), z.number()]).array(),
});

export const mlInferPredictResponseSchema = z.object({
  polygons: mlInferPredictedPolygonSchema.array(),
});

/**
 * Internal contract between apps/api and apps/ml-infer (detection).
 */
export const mlInferDetectRequestSchema = z.object({
  imageUrl: z.string().url(),
  modelUrl: z.string().url(),
  modelId: z.number().int().positive(),
  conf: z.number().min(0).max(1).optional(),
  iou: z.number().min(0).max(1).optional(),
  minAreaPx: z.number().min(0).max(10000).optional(),
  maxDet: z.number().int().min(1).max(10000).optional(),
});

export const mlInferDetectedRectangleSchema = z.object({
  classIndex: z.number().int().min(0),
  score: z.number().min(0).max(1),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

export const mlInferDetectResponseSchema = z.object({
  rectangles: mlInferDetectedRectangleSchema.array(),
});
