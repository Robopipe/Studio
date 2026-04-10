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
  labelId: z.number()
})


/**
 * Task schemas
 */
export const createTaskSchema = z.object({
  iid: z.string().optional(),
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
  order: z
    .union([z.literal("asc"), z.literal("desc")])
    .optional()
    .default("asc"),
});

export const paginatedTaskSchema = paginatedResponseSchema(taskSchema);


