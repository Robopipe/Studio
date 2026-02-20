import { defineRelations } from "drizzle-orm";
import * as schema from '../entities'

export const relations = defineRelations(schema, (r) => ({
  userTable: {
    organization: r.one.organizationTable({
      from: r.userTable.organizationId,
      to: r.organizationTable.id,
    }),
  },
  organizationTable: {
    users: r.many.userTable(),
    projects: r.many.projectTable(),
  },
  projectTable: {
    organization: r.one.organizationTable({
      from: r.projectTable.organizationId,
      to: r.organizationTable.id,
    }),
    tasks: r.many.taskTable(),
    labels: r.many.projectLabelTable(),
    dashboardConfigurationItems: r.many.dashboardConfigurationItemTable(),
  },
  taskTable: {
    project: r.one.projectTable({
      from: r.taskTable.projectId,
      to: r.projectTable.id,
    }),
    rectangleAnnotations: r.many.rectangleAnnotationTable(),
    polygonAnnotations: r.many.polygonAnnotationTable(),
    classificationAnnotations: r.many.classificationAnnotationTable(),
  },
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
  modelTable: {
    project: r.one.projectTable({
      from: r.modelTable.projectId,
      to: r.projectTable.id,
    }),
    labels: r.many.projectLabelTable({
      from: r.modelTable.id.through(r.modelLabelTable.modelId),
      to: r.projectLabelTable.id.through(r.modelLabelTable.labelId),
    }),
    outputs: r.many.modelOutputTable(),
  },
  modelLabelTable: {
    model: r.one.modelTable({
      from: r.modelLabelTable.modelId,
      to: r.modelTable.id,
    }),
    label: r.one.projectLabelTable({
      from: r.modelLabelTable.labelId,
      to: r.projectLabelTable.id,
    }),
  },
  projectLabelTable: {
    project: r.one.projectTable({
      from: r.projectLabelTable.projectId,
      to: r.projectTable.id,
    }),
    polygonAnnotations: r.many.polygonAnnotationTable(),
    rectangleAnnotations: r.many.rectangleAnnotationTable(),
    classificationAnnotations: r.many.classificationAnnotationTable(),
  },
  modelOutputTable: {
    model: r.one.modelTable({
      from: r.modelOutputTable.modelId,
      to: r.modelTable.id,
    }),
  },
  dashboardConfigurationItemTable: {
    project: r.one.projectTable({
      from: r.dashboardConfigurationItemTable.projectId,
      to: r.projectTable.id,
    }),
    targetLabel: r.one.projectLabelTable({
      from: r.dashboardConfigurationItemTable.targetLabelId,
      to: r.projectLabelTable.id,
    }),
    targetParentLabel: r.one.projectLabelTable({
      from: r.dashboardConfigurationItemTable.targetParentLabelId,
      to: r.projectLabelTable.id,
    }),
  },
}));
