import { ModelBackendEnum, ModelQuantizationEnum, ModelRegionEnum, ModelStatusEnum, ProjectTypeEnum } from "@repo/schema";
import * as p from "drizzle-orm/pg-core";
import { id, timestamps } from "../helpers";
import { datasetVersionTable } from "./dataset-version";
import { modelOutputTypeEnum } from "./model-output";
import { projectTable } from "./project";

export const modelStatusEnum = p.pgEnum("model_status_enum", [
  ModelStatusEnum.DRAFT,
  ModelStatusEnum.TRAINING,
  ModelStatusEnum.CONVERTING,
  ModelStatusEnum.DONE,
  ModelStatusEnum.ERROR,
  ModelStatusEnum.CANCELLED,
]);

export const modelTrainingTypeEnum = p.pgEnum("model_training_type_enum", [
  ProjectTypeEnum.CLASSIFICATION,
  ProjectTypeEnum.DETECTION,
  ProjectTypeEnum.SEGMENTATION,
]);

export const modelBackendEnum = p.pgEnum("model_backend_enum", [
  ModelBackendEnum.LUXONIS,
  ModelBackendEnum.ULTRALYTICS,
]);

export const modelRegionEnum = p.pgEnum("model_region_enum", [
  ModelRegionEnum.EUROPE_WEST4,
  ModelRegionEnum.US_CENTRAL1,
]);

export const modelQuantizationEnum = p.pgEnum("model_quantization_enum", [
  ModelQuantizationEnum.FP16,
  ModelQuantizationEnum.INT8,
]);

export const modelTable = p.pgTable("model", {
  id,
  name: p.varchar("name", { length: 256 }).notNull(),
  epochs: p.integer("epochs").notNull(),
  outputTypes: modelOutputTypeEnum("output_types").array().notNull(),
  backend: modelBackendEnum("backend").notNull().default(ModelBackendEnum.LUXONIS),
  region: modelRegionEnum("region").notNull().default(ModelRegionEnum.EUROPE_WEST4),
  quantization: modelQuantizationEnum("quantization")
    .notNull()
    .default(ModelQuantizationEnum.FP16),
  trainingType: modelTrainingTypeEnum("training_type").notNull(),
  annotationsUsed: modelTrainingTypeEnum("annotations_used").array().notNull(),
  splitTrain: p.integer("split_train").notNull(),
  splitValidate: p.integer("split_validate").notNull(),
  splitTest: p.integer("split_test").notNull(),
  customHyperparams: p.jsonb("custom_hyperparams").notNull().default({}),
  status: modelStatusEnum("status").notNull(),
  batchJobName: p.text("batch_job_name"),
  errorMessage: p.text("error_message"),
  finalAccuracy: p.real("final_accuracy"),
  finalLoss: p.real("final_loss"),
  // Best mAP@50 across all epochs (det/seg only). Null for classification —
  // FE falls back to `finalAccuracy` (which is `accuracy_top1` for cls).
  bestMap50: p.real("best_map50"),
  projectId: p
    .integer("project_id")
    .references(() => projectTable.id, { onDelete: "cascade" })
    .notNull(),
  datasetVersionId: p
    .integer("dataset_version_id")
    .references(() => datasetVersionTable.id, { onDelete: "set null" }),
  useGroups: p.boolean("use_groups").notNull().default(false),
  ...timestamps,
});
