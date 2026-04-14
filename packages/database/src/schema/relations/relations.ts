import { defineRelations } from "drizzle-orm";
import * as schema from '../entities'

export const relationBase = defineRelations(schema, (r) => ({
  projectTable: {
    organization: r.one.organizationTable({
      from: r.projectTable.organizationId,
      to: r.organizationTable.id,
    }),
    tasks: r.many.taskTable({
      from: r.projectTable.id,
      to: r.taskTable.projectId,
    }),
    labels: r.many.projectLabelTable({
      from: r.projectTable.id,
      to: r.projectLabelTable.projectId,
    }),
    dashboardConfigurations: r.many.dashboardConfigurationTable({
      from: r.projectTable.id,
      to: r.dashboardConfigurationTable.projectId,
    }),
    capturedVideos: r.many.capturedVideoTable({
      from: r.projectTable.id,
      to: r.capturedVideoTable.projectId,
    }),
  },
  taskTable: {
    project: r.one.projectTable({
      from: r.taskTable.projectId,
      to: r.projectTable.id,
    }),
    rectangleAnnotations: r.many.rectangleAnnotationTable({
      from: r.taskTable.id,
      to: r.rectangleAnnotationTable.taskId,
    }),
    polygonAnnotations: r.many.polygonAnnotationTable({
      from: r.taskTable.id,
      to: r.polygonAnnotationTable.taskId,
    }),
    classificationAnnotations: r.many.classificationAnnotationTable({
      from: r.taskTable.id,
      to: r.classificationAnnotationTable.taskId,
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
    outputs: r.many.modelOutputTable({
      from: r.modelTable.id,
      to: r.modelOutputTable.modelId,
    }),
    augmentations: r.many.modelAugmentationTable({
      from: r.modelTable.id,
      to: r.modelAugmentationTable.modelId,
    }),
    preprocessings: r.many.modelPreprocessingTable({
      from: r.modelTable.id,
      to: r.modelPreprocessingTable.modelId,
    }),
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
    polygonAnnotations: r.many.polygonAnnotationTable({
      from: r.projectLabelTable.id,
      to: r.polygonAnnotationTable.labelId,
    }),
    rectangleAnnotations: r.many.rectangleAnnotationTable({
      from: r.projectLabelTable.id,
      to: r.rectangleAnnotationTable.labelId,
    }),
    classificationAnnotations: r.many.classificationAnnotationTable({
      from: r.projectLabelTable.id,
      to: r.classificationAnnotationTable.labelId,
    }),
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
    model: r.one.modelTable({
      from: r.dashboardConfigurationTable.modelId,
      to: r.modelTable.id,
    }),
    evaluation: r.one.dashboardEvaluationTable({
      from: r.dashboardConfigurationTable.id,
      to: r.dashboardEvaluationTable.dashboardConfigurationId,
    }),
    testCases: r.many.evalTestCaseTable({
      from: r.dashboardConfigurationTable.id,
      to: r.evalTestCaseTable.dashboardConfigurationId,
    }),
    masterThresholds: r.many.evalThresholdTable({
      from: r.dashboardConfigurationTable.id,
      to: r.evalThresholdTable.dashboardConfigurationId,
    }),
  },
  capturedVideoTable: {
    project: r.one.projectTable({
      from: r.capturedVideoTable.projectId,
      to: r.projectTable.id,
    }),
  },
  dashboardEvaluationTable: {
    dashboardConfiguration: r.one.dashboardConfigurationTable({
      from: r.dashboardEvaluationTable.dashboardConfigurationId,
      to: r.dashboardConfigurationTable.id,
    }),
  },
}));
