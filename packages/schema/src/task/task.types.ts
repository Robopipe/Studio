import {
  classificationAnnotationSchema,
  polygonAnnotationSchema,
  rectangleAnnotationSchema,
  taskDetailSchema,
  taskSchema,
} from "./task.schema";
import z from "zod";

export type RectangleAnnotation = z.infer<typeof rectangleAnnotationSchema>
export type ClassificationAnnotation = z.infer<typeof classificationAnnotationSchema>
export type PolygonAnnotation = z.infer<typeof polygonAnnotationSchema>
export type Task = z.infer<typeof taskSchema>
export type TaskDetail = z.infer<typeof taskDetailSchema>
