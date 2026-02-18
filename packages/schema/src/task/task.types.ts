import {
  classificationAnnotationSchema,
  createClassificationAnnotationSchema,
  createPolygonAnnotationSchema,
  createRectangleAnnotationSchema,
  polygonAnnotationSchema,
  rectangleAnnotationSchema,
  taskDetailSchema,
  taskSchema,
  updateTaskSchema,
} from "./task.schema";
import z from "zod";

export type RectangleAnnotation = z.infer<typeof rectangleAnnotationSchema>
export type ClassificationAnnotation = z.infer<typeof classificationAnnotationSchema>
export type PolygonAnnotation = z.infer<typeof polygonAnnotationSchema>
export type CreateRectangleAnnotation = z.infer<typeof createRectangleAnnotationSchema>
export type CreateClassificationAnnotation = z.infer<typeof createClassificationAnnotationSchema>
export type CreatePolygonAnnotation = z.infer<typeof createPolygonAnnotationSchema>
export type Task = z.infer<typeof taskSchema>
export type TaskDetail = z.infer<typeof taskDetailSchema>
export type UpdateTask = z.infer<typeof updateTaskSchema>
