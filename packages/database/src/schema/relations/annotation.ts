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
  },
}))
