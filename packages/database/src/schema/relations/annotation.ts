import { defineRelationsPart } from "drizzle-orm";
import * as schema from '../entities'

export const relationAnnotationPart = defineRelationsPart(schema, (r) => ({
  rectangleAnnotationTable: {
    task: r.one.taskTable({
      from: r.rectangleAnnotationTable.taskId,
      to: r.taskTable.id,
    }),
    label: r.one.projectLabelTable({
      from: r.rectangleAnnotationTable.labelId,
      to: r.projectLabelTable.id,
    }),
    history: r.many.rectangleAnnotationHistoryTable(),
  },
  polygonAnnotationTable: {
    task: r.one.taskTable({
      from: r.polygonAnnotationTable.taskId,
      to: r.taskTable.id,
    }),
    label: r.one.projectLabelTable({
      from: r.polygonAnnotationTable.labelId,
      to: r.projectLabelTable.id,
    }),
    history: r.many.polygonAnnotationHistoryTable(),
  },
  classificationAnnotationTable: {
    task: r.one.taskTable({
      from: r.classificationAnnotationTable.taskId,
      to: r.taskTable.id,
    }),
    label: r.one.projectLabelTable({
      from: r.classificationAnnotationTable.labelId,
      to: r.projectLabelTable.id,
    }),
    history: r.many.classificationAnnotationHistoryTable(),
  },
  rectangleAnnotationHistoryTable: {
    annotation: r.one.rectangleAnnotationTable({
      from: r.rectangleAnnotationHistoryTable.annotationId,
      to: r.rectangleAnnotationTable.id,
    }),
    user: r.one.userTable({
      from: r.rectangleAnnotationHistoryTable.userId,
      to: r.userTable.id,
    }),
  },
  polygonAnnotationHistoryTable: {
    annotation: r.one.polygonAnnotationTable({
      from: r.polygonAnnotationHistoryTable.annotationId,
      to: r.polygonAnnotationTable.id,
    }),
    user: r.one.userTable({
      from: r.polygonAnnotationHistoryTable.userId,
      to: r.userTable.id,
    }),
  },
  classificationAnnotationHistoryTable: {
    annotation: r.one.classificationAnnotationTable({
      from: r.classificationAnnotationHistoryTable.annotationId,
      to: r.classificationAnnotationTable.id,
    }),
    user: r.one.userTable({
      from: r.classificationAnnotationHistoryTable.userId,
      to: r.userTable.id,
    }),
  },
}))
