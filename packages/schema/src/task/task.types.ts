import {
  classificationAnnotationSchema,
  confirmTaskUploadSchema,
  createClassificationAnnotationSchema,
  createPolygonAnnotationSchema,
  createRectangleAnnotationSchema,
  createTaskSchema,
  paginatedTaskSchema,
  polygonAnnotationSchema,
  rectangleAnnotationSchema,
  requestTaskUploadSchema,
  taskDetailSchema,
  taskExportQuerySchema,
  taskExportSchema,
  taskPaginationQuerySchema,
  taskSchema,
  taskUploadUrlSchema,
  updateTaskSchema,
} from "./task.schema";
import z from "zod";

export type RectangleAnnotation = z.infer<typeof rectangleAnnotationSchema>
export type ClassificationAnnotation = z.infer<typeof classificationAnnotationSchema>
export type PolygonAnnotation = z.infer<typeof polygonAnnotationSchema>
export type CreateRectangleAnnotation = z.infer<typeof createRectangleAnnotationSchema>
export type CreateClassificationAnnotation = z.infer<typeof createClassificationAnnotationSchema>
export type CreatePolygonAnnotation = z.infer<typeof createPolygonAnnotationSchema>
export type CreateTask = z.infer<typeof createTaskSchema>
export type Task = z.infer<typeof taskSchema>
export type TaskDetail = z.infer<typeof taskDetailSchema>
export type UpdateTask = z.infer<typeof updateTaskSchema>
export type TaskPaginationQuery = z.infer<typeof taskPaginationQuerySchema>
export type PaginatedTasks = z.infer<typeof paginatedTaskSchema>
export type RequestTaskUpload = z.infer<typeof requestTaskUploadSchema>
export type TaskUploadUrl = z.infer<typeof taskUploadUrlSchema>
export type ConfirmTaskUpload = z.infer<typeof confirmTaskUploadSchema>
export type TaskExport = z.infer<typeof taskExportSchema>
export type TaskExportQuery = z.infer<typeof taskExportQuerySchema>
