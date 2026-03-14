import { defineRelations } from "drizzle-orm";
import * as schema from '../entities'

export const relationBase = defineRelations(schema, (r) => ({
  projectTable: {
    organization: r.one.organizationTable({
      from: r.projectTable.organizationId,
      to: r.organizationTable.id,
    }),
    tasks: r.many.taskTable(),
    labels: r.many.projectLabelTable(),
    dashboardConfigurations: r.many.dashboardConfigurationTable(),
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
  dashboardConfigurationTable: {
    project: r.one.projectTable({
      from: r.dashboardConfigurationTable.projectId,
      to: r.projectTable.id,
    }),
    items: r.many.dashboardConfigurationItemTable(),
    evaluation: r.one.dashboardEvaluationTable({
      from: r.dashboardConfigurationTable.id,
      to: r.dashboardEvaluationTable.dashboardConfigurationId,
    }),
  },
  dashboardEvaluationTable: {
    dashboardConfiguration: r.one.dashboardConfigurationTable({
      from: r.dashboardEvaluationTable.dashboardConfigurationId,
      to: r.dashboardConfigurationTable.id,
    }),
  },
  dashboardConfigurationItemTable: {
    dashboardConfiguration: r.one.dashboardConfigurationTable({
      from: r.dashboardConfigurationItemTable.dashboardConfigurationId,
      to: r.dashboardConfigurationTable.id,
    }),
    targetLabel: r.one.projectLabelTable({
      from: r.dashboardConfigurationItemTable.targetLabelId,
      to: r.projectLabelTable.id,
    }),
    targetParentLabel: r.one.projectLabelTable({
      from: r.dashboardConfigurationItemTable.targetParentLabelId,
      to: r.projectLabelTable.id,
    }),
  }
}));
