import {
  classificationAnnotationSchema,
  classificationAnnotationHistoryGroupSchema,
  classificationHistoryEventSchema,
  confirmTaskUploadSchema,
  createClassificationAnnotationSchema,
  createPolygonAnnotationSchema,
  createRectangleAnnotationSchema,
  createTaskSchema,
  importedEventIdsResponseSchema,
  importedEventsQuerySchema,
  paginatedTaskSchema,
  polygonAnnotationSchema,
  polygonAnnotationHistoryGroupSchema,
  polygonHistoryEventSchema,
  rectangleAnnotationSchema,
  rectangleAnnotationHistoryGroupSchema,
  rectangleHistoryEventSchema,
  requestTaskUploadSchema,
  taskDetailSchema,
  taskExportQuerySchema,
  taskExportSchema,
  taskHistoryResponseSchema,
  taskIdsQuerySchema,
  taskIdsResponseSchema,
  taskPaginationQuerySchema,
  taskSchema,
  taskUploadContentTypeSchema,
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
// Input type: contentType has a schema default, so callers may omit it.
export type RequestTaskUploadInput = z.input<typeof requestTaskUploadSchema>
export type TaskUploadContentType = z.infer<typeof taskUploadContentTypeSchema>
export type TaskUploadUrl = z.infer<typeof taskUploadUrlSchema>
export type ConfirmTaskUpload = z.infer<typeof confirmTaskUploadSchema>
export type ImportedEventsQuery = z.infer<typeof importedEventsQuerySchema>
export type ImportedEventIdsResponse = z.infer<typeof importedEventIdsResponseSchema>
export type TaskExport = z.infer<typeof taskExportSchema>
export type TaskExportQuery = z.infer<typeof taskExportQuerySchema>
export type TaskIdsQuery = z.infer<typeof taskIdsQuerySchema>
export type TaskIdsResponse = z.infer<typeof taskIdsResponseSchema>
export type TaskHistory = z.infer<typeof taskHistoryResponseSchema>
export type RectangleAnnotationHistoryGroup = z.infer<typeof rectangleAnnotationHistoryGroupSchema>
export type PolygonAnnotationHistoryGroup = z.infer<typeof polygonAnnotationHistoryGroupSchema>
export type ClassificationAnnotationHistoryGroup = z.infer<typeof classificationAnnotationHistoryGroupSchema>
export type RectangleHistoryEvent = z.infer<typeof rectangleHistoryEventSchema>
export type PolygonHistoryEvent = z.infer<typeof polygonHistoryEventSchema>
export type ClassificationHistoryEvent = z.infer<typeof classificationHistoryEventSchema>
