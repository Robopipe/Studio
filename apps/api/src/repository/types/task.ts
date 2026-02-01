import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { taskTable } from "@repo/database";
import { RectangleAnnotationSelect } from "./rectangle-annotation";
import { PolygonAnnotationSelect } from "./polygon-annotation";
import { ClassificationAnnotationSelect } from "./classification-annotation";

export type TaskSelect = InferSelectModel<typeof taskTable> & { annotationCount?: number };
export type TaskDetailSelect = TaskSelect & {
  rectangleAnnotations: RectangleAnnotationSelect[];
  polygonAnnotations: PolygonAnnotationSelect[];
  classificationAnnotations: ClassificationAnnotationSelect[];
};

export type TaskInsert = InferInsertModel<typeof taskTable>
export type TaskUpdate = TaskInsert;
