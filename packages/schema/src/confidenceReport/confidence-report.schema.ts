import z from "zod";
import { annotationBoxStatsSchema } from "../analytics/analytics.schema";

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum ConfidenceReportStatusEnum {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  DONE = "DONE",
  ERROR = "ERROR",
  CANCELLED = "CANCELLED",
}

export enum ConfidenceReportGtGeometryEnum {
  /** Use rectangle annotations as ground truth. */
  RECTANGLE = "RECTANGLE",
  /** Use polygon annotations as ground truth (converted to bounding boxes for
   *  detection models; used as masks for segmentation models). */
  POLYGON = "POLYGON",
}

// ─── Run request ──────────────────────────────────────────────────────────────

export const runConfidenceReportSchema = z.object({
  modelId: z.number().int().positive(),
  conf: z.number().min(0).max(1),
  gtGeometry: z.enum(ConfidenceReportGtGeometryEnum),
});

// ─── Per-class stats (written by the complete webhook) ────────────────────────

export const confidenceReportPerClassStatSchema = z.object({
  labelId: z.number(),
  name: z.string(),
  color: z.string(),
  /** Box-plot stats for the confidence scores of all kept detections of this class. */
  confidence: annotationBoxStatsSchema,
  /** Box-plot stats for the matched-TP IoU values (IoU≥0.5). Null when there
   *  are no matched true-positives for this class. */
  iou: annotationBoxStatsSchema.nullable(),
  /** Total number of detections (above conf threshold) for this class. */
  detectionCount: z.number(),
  /** Total number of matched TPs for this class. */
  tpCount: z.number(),
});

// ─── Full confidence-report response (GET) ────────────────────────────────────

export const confidenceReportSchema = z.object({
  id: z.number(),
  projectId: z.number(),
  modelId: z.number().nullable(),
  /** Name of the model at run time. Optional so the raw DB row parses without a join. */
  modelName: z.string().nullable().optional(),
  conf: z.number(),
  gtGeometry: z.enum(ConfidenceReportGtGeometryEnum),
  status: z.enum(ConfidenceReportStatusEnum),
  processed: z.number(),
  total: z.number(),
  errorMessage: z.string().nullable(),
  perClassStats: confidenceReportPerClassStatSchema.array().nullable(),
  /** Dataset-level micro precision. Null until run completes or when no predictions. */
  overallPrecision: z.number().nullable().optional(),
  /** Dataset-level micro recall. Null until run completes or when no GT. */
  overallRecall: z.number().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ─── Webhook payloads (ML → API) ──────────────────────────────────────────────

// ─── Inferred regions (persisted from the job's predictions) ─────────────────

/**
 * A single inferred region as sent from the ML job via the progress webhook.
 * Coordinates are in percentage units (0–100), matching the annotation convention.
 */
export const confidenceReportRegionInputSchema = z.object({
  labelId: z.number(),
  score: z.number(),
  geometry: z.enum(ConfidenceReportGtGeometryEnum),
  /** Matched IoU against the ground-truth annotation (TP only; null/absent for false positives). */
  iou: z.number().nullable().optional(),
  /** DB id of the matched ground-truth annotation (rectangle or polygon). Null for FP. */
  matchedAnnotationId: z.number().nullable().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  value: z.tuple([z.number(), z.number()]).array().optional(),
});

/**
 * A single inferred region as returned to the web client (GET endpoint).
 * Same as input but with server-assigned id and embedded label info.
 */
export const confidenceReportRegionResponseSchema = z.object({
  id: z.number(),
  label: z.object({
    id: z.number(),
    name: z.string(),
    color: z.string(),
  }),
  score: z.number(),
  geometry: z.enum(ConfidenceReportGtGeometryEnum),
  /** Matched IoU against the ground-truth annotation (TP only; null for false positives). */
  iou: z.number().nullish(),
  /** DB id of the matched ground-truth annotation. Null for false positives. */
  matchedAnnotationId: z.number().nullish(),
  x: z.number().nullish(),
  y: z.number().nullish(),
  width: z.number().nullish(),
  height: z.number().nullish(),
  value: z.tuple([z.number(), z.number()]).array().nullish(),
});

// ─── Webhook payloads (ML → API) ──────────────────────────────────────────────

/**
 * Periodic progress webhook — sent every N tasks.
 * Carries per-task scalars and inferred regions for tasks processed in this chunk.
 */
export const confidenceReportTaskResultSchema = z.object({
  taskId: z.number(),
  meanConfidence: z.number().nullable(),
  /** Mean matched-TP IoU for the image. Null when no TP match or task unannotated. */
  meanIou: z.number().nullable(),
  /** Micro-averaged precision for the image: TP/(TP+FP). Null when no predictions or task unannotated. */
  precision: z.number().nullable(),
  /** Micro-averaged recall for the image: TP/(TP+FN). Null when no ground truth or task unannotated. */
  recall: z.number().nullable(),
  regions: confidenceReportRegionInputSchema.array().default([]),
});

export const confidenceReportProgressSchema = z.object({
  processed: z.number(),
  total: z.number(),
  taskResults: confidenceReportTaskResultSchema.array(),
});

/**
 * Final complete webhook — sent once at the end of a successful run.
 * Carries per-class box-stats and dataset-level precision/recall.
 */
export const confidenceReportCompleteSchema = z.object({
  perClassStats: confidenceReportPerClassStatSchema.array(),
  /** Dataset-level micro precision: ΣTP/(ΣTP+ΣFP). Null when no predictions in the run. */
  overallPrecision: z.number().nullable(),
  /** Dataset-level micro recall: ΣTP/(ΣTP+ΣFN). Null when no GT in the run. */
  overallRecall: z.number().nullable(),
});

export const confidenceReportErrorSchema = z.object({
  errorMessage: z.string(),
});
