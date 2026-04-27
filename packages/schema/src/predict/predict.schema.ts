import z from "zod";

/**
 * Body of POST /v1/projects/:projectId/tasks/:taskId/predict.
 * The model is project-scoped; the API verifies the model belongs to the
 * same project before invoking ml-infer.
 */
export const predictRequestSchema = z.object({
  modelId: z.number().int().positive(),
  conf: z.number().min(0).max(1).optional(),
  iou: z.number().min(0).max(1).optional(),
  polyEpsilon: z.number().min(0).max(0.05).optional(),
  maskThreshold: z.number().min(0).max(1).optional(),
  minAreaPx: z.number().min(0).max(10000).optional(),
  fillConcavities: z.boolean().optional(),
});

/**
 * One predicted polygon, already mapped from the model's classIndex onto
 * a project labelId. `value` matches polygonAnnotationSchema.value
 * (pixel coords in the original image space) so consumers can hand the
 * point list straight to the canvas / save endpoint without remapping.
 */
export const predictedPolygonSchema = z.object({
  labelId: z.number().int().positive(),
  score: z.number().min(0).max(1),
  value: z.tuple([z.number(), z.number()]).array(),
});

export const predictResponseSchema = z.object({
  polygons: predictedPolygonSchema.array(),
});

/**
 * Internal contract between apps/api and apps/ml-infer. Not exposed to
 * clients, but kept in the shared schema package so both services derive
 * types from the same source of truth.
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
  fillConcavities: z.boolean().optional(),
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
