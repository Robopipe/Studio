import z from "zod";
import { labelSchema } from "../label";
import { paginatedResponseSchema, paginationQuerySchema, timestampsSchema } from "../helpers";

export enum TaskStatusEnum {
  TODO = "TODO",
  DONE = "DONE"
}


export enum TaskFileTypeEnum {
  GS = "GS"
  // Add local and other adapters in the future
}

/**
 * Rectangle annotations
 */
export const rectangleAnnotationSchema = z.object({
  id: z.number(),
  label: labelSchema,
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
})

export const createRectangleAnnotationSchema = z.object({
  id: z.number().int().positive().optional(),
  labelId: z.number(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
})

/**
 * Polygon annotations
 */
export const polygonAnnotationSchema = z.object({
  id: z.number(),
  label: labelSchema,
  value: z.tuple([z.number(), z.number()]).array(),
})

export const createPolygonAnnotationSchema = z.object({
  id: z.number().int().positive().optional(),
  labelId: z.number(),
  value: z.tuple([z.number(), z.number()]).array(),
});

/**
 * Classification annotations
 */
export const classificationAnnotationSchema = z.object({
  id: z.number(),
  label: labelSchema,
})

export const createClassificationAnnotationSchema = z.object({
  id: z.number().int().positive().optional(),
  labelId: z.number()
})


/**
 * Task schemas
 */
export const createTaskSchema = z.object({
  iid: z.string().optional(),
  capturedAt: z.iso.datetime().optional(),
})

export const taskSchema = z.object({
  id: z.number(),
  iid: z.string(),
  fileType: z.enum(TaskFileTypeEnum),
  filePath: z.string(),
  thumbnailUrl: z.string(),
  width: z.number(),
  height: z.number(),
  status: z.enum(TaskStatusEnum),
  annotationCount: z.number().nullable(),
  ...timestampsSchema
})

export const taskDetailSchema = taskSchema.extend({
  rectangleAnnotations: rectangleAnnotationSchema.array().nullable(),
  polygonAnnotations: polygonAnnotationSchema.array().nullable(),
  classificationAnnotations: classificationAnnotationSchema.array().nullable(),
})

export const updateTaskSchema = z.object({
  rectangleAnnotations: createRectangleAnnotationSchema.array().nullish(),
  polygonAnnotations: createPolygonAnnotationSchema.array().nullish(),
  classificationAnnotations: createClassificationAnnotationSchema.array().nullish(),
  reviewed: z.boolean().optional(),
});

export const taskPaginationQuerySchema = paginationQuerySchema.extend({
  deleted: z
    .union([z.literal("true"), z.literal("false"), z.literal("null")])
    .optional()
    .transform((val): boolean | null => {
      if (val === "true") return true;
      if (val === "null") return null;
      return false;
    }),
  annotated: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((val): boolean | undefined => {
      if (val === "true") return true;
      if (val === "false") return false;
      return undefined;
    }),
  labelIds: z
    .string()
    .optional()
    .transform((val): number[] | undefined => {
      if (!val) return undefined;
      return val.split(",").map(Number).filter((n) => !isNaN(n));
    }),
  ids: z
    .string()
    .optional()
    .transform((val): number[] | undefined => {
      if (!val) return undefined;
      return val.split(",").map(Number).filter((n) => !isNaN(n));
    }),
  order: z
    .union([z.literal("asc"), z.literal("desc")])
    .optional()
    .default("asc"),
});

export const paginatedTaskSchema = paginatedResponseSchema(taskSchema);

/**
 * Capture upload — 3-step signed-URL flow
 *  1. POST request-upload-url → { pendingTaskId, uploadUrl, objectPath }
 *  2. browser PUTs image bytes directly to GCS
 *  3. POST confirm → promotes pending row into a real Task
 */
export const requestTaskUploadSchema = z.object({
  capturedAt: z.iso.datetime().optional(),
});

export const taskUploadUrlSchema = z.object({
  pendingTaskId: z.number(),
  uploadUrl: z.string(),
  objectPath: z.string(),
});

export const confirmTaskUploadSchema = z.object({
  pendingTaskId: z.number(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

/**
 * Bulk task export — one JSON document containing every task that matches
 * the data-source filters, with its full annotation set split by type.
 * Annotations carry only labelId; the top-level `labels` list lets
 * consumers decode them.
 */
export const taskExportRectangleAnnotationSchema = z.object({
  id: z.number(),
  labelId: z.number(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

export const taskExportPolygonAnnotationSchema = z.object({
  id: z.number(),
  labelId: z.number(),
  value: z.tuple([z.number(), z.number()]).array(),
});

export const taskExportClassificationAnnotationSchema = z.object({
  id: z.number(),
  labelId: z.number(),
});

export const taskExportItemSchema = z.object({
  id: z.number(),
  iid: z.string(),
  filePath: z.string(),
  width: z.number(),
  height: z.number(),
  status: z.enum(TaskStatusEnum),
  createdAt: z.iso.datetime(),
  rectangleAnnotations: taskExportRectangleAnnotationSchema.array(),
  polygonAnnotations: taskExportPolygonAnnotationSchema.array(),
  classificationAnnotations: taskExportClassificationAnnotationSchema.array(),
});

export const taskExportSchema = z.object({
  project: z.object({
    id: z.number(),
    name: z.string(),
  }),
  exportedAt: z.iso.datetime(),
  labels: z
    .object({
      id: z.number(),
      name: z.string(),
      color: z.string(),
    })
    .array(),
  tasks: taskExportItemSchema.array(),
});

export const taskExportQuerySchema = z.object({
  annotated: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((val): boolean | undefined => {
      if (val === "true") return true;
      if (val === "false") return false;
      return undefined;
    }),
  labelIds: z
    .string()
    .optional()
    .transform((val): number[] | undefined => {
      if (!val) return undefined;
      return val.split(",").map(Number).filter((n) => !isNaN(n));
    }),
});

/**
 * Lightweight id-only listing — returns just the ordered list of task IDs
 * matching the given filters. Used by the client to power cross-page
 * "select all" and shift-click range selection without loading every task row.
 */
export const taskIdsQuerySchema = z.object({
  annotated: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((val): boolean | undefined => {
      if (val === "true") return true;
      if (val === "false") return false;
      return undefined;
    }),
  labelIds: z
    .string()
    .optional()
    .transform((val): number[] | undefined => {
      if (!val) return undefined;
      return val.split(",").map(Number).filter((n) => !isNaN(n));
    }),
  order: z
    .union([z.literal("asc"), z.literal("desc")])
    .optional()
    .default("asc"),
});

export const taskIdsResponseSchema = z.object({
  ids: z.number().array(),
});

/**
 * Annotation history
 */
export const annotationHistoryActionSchema = z.enum(["created", "updated"]);

const historyUserSchema = z.object({
  id: z.number(),
  fullName: z.string(),
}).nullable();

export const rectangleHistorySnapshotSchema = z.object({
  labelId: z.number(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

export const polygonHistorySnapshotSchema = z.object({
  labelId: z.number(),
  value: z.tuple([z.number(), z.number()]).array(),
});

export const classificationHistorySnapshotSchema = z.object({
  labelId: z.number(),
});

const historyEventBaseSchema = z.object({
  id: z.number(),
  action: annotationHistoryActionSchema,
  createdAt: z.iso.datetime(),
  user: historyUserSchema,
});

export const rectangleHistoryEventSchema = historyEventBaseSchema.extend({
  snapshot: rectangleHistorySnapshotSchema,
});

export const polygonHistoryEventSchema = historyEventBaseSchema.extend({
  snapshot: polygonHistorySnapshotSchema,
});

export const classificationHistoryEventSchema = historyEventBaseSchema.extend({
  snapshot: classificationHistorySnapshotSchema,
});

export const rectangleAnnotationHistoryGroupSchema = z.object({
  annotationId: z.number(),
  events: rectangleHistoryEventSchema.array(),
});

export const polygonAnnotationHistoryGroupSchema = z.object({
  annotationId: z.number(),
  events: polygonHistoryEventSchema.array(),
});

export const classificationAnnotationHistoryGroupSchema = z.object({
  annotationId: z.number(),
  events: classificationHistoryEventSchema.array(),
});

export const taskHistoryResponseSchema = z.object({
  rectangleHistory: rectangleAnnotationHistoryGroupSchema.array(),
  polygonHistory: polygonAnnotationHistoryGroupSchema.array(),
  classificationHistory: classificationAnnotationHistoryGroupSchema.array(),
});
