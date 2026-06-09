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
    datasets: r.many.datasetTable({
      from: r.projectTable.id,
      to: r.datasetTable.projectId,
    }),
    dashboardConfigurations: r.many.dashboardConfigurationTable({
      from: r.projectTable.id,
      to: r.dashboardConfigurationTable.projectId,
    }),
    capturedVideos: r.many.capturedVideoTable({
      from: r.projectTable.id,
      to: r.capturedVideoTable.projectId,
    }),
    preAnnotateSettings: r.many.projectPreAnnotateSettingsTable({
      from: r.projectTable.id,
      to: r.projectPreAnnotateSettingsTable.projectId,
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
    preAnnotateSettings: r.many.projectPreAnnotateSettingsTable({
      from: r.modelTable.id,
      to: r.projectPreAnnotateSettingsTable.modelId,
    }),
    datasetVersion: r.one.datasetVersionTable({
      from: r.modelTable.datasetVersionId,
      to: r.datasetVersionTable.id,
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
  datasetTable: {
    project: r.one.projectTable({
      from: r.datasetTable.projectId,
      to: r.projectTable.id,
    }),
    versions: r.many.datasetVersionTable({
      from: r.datasetTable.id,
      to: r.datasetVersionTable.datasetId,
    }),
  },
  datasetVersionTable: {
    dataset: r.one.datasetTable({
      from: r.datasetVersionTable.datasetId,
      to: r.datasetTable.id,
    }),
    tasks: r.many.taskTable({
      from: r.datasetVersionTable.id.through(r.datasetVersionTaskTable.datasetVersionId),
      to: r.taskTable.id.through(r.datasetVersionTaskTable.taskId),
    }),
  },
  datasetVersionTaskTable: {
    datasetVersion: r.one.datasetVersionTable({
      from: r.datasetVersionTaskTable.datasetVersionId,
      to: r.datasetVersionTable.id,
    }),
    task: r.one.taskTable({
      from: r.datasetVersionTaskTable.taskId,
      to: r.taskTable.id,
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
    capturedVideo: r.one.capturedVideoTable({
      from: r.dashboardConfigurationTable.capturedVideoId,
      to: r.capturedVideoTable.id,
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
    dashboardConfigurations: r.many.dashboardConfigurationTable({
      from: r.capturedVideoTable.id,
      to: r.dashboardConfigurationTable.capturedVideoId,
    }),
  },
  dashboardEvaluationTable: {
    dashboardConfiguration: r.one.dashboardConfigurationTable({
      from: r.dashboardEvaluationTable.dashboardConfigurationId,
      to: r.dashboardConfigurationTable.id,
    }),
  },
  projectPreAnnotateSettingsTable: {
    project: r.one.projectTable({
      from: r.projectPreAnnotateSettingsTable.projectId,
      to: r.projectTable.id,
    }),
    model: r.one.modelTable({
      from: r.projectPreAnnotateSettingsTable.modelId,
      to: r.modelTable.id,
    }),
  },
}));
