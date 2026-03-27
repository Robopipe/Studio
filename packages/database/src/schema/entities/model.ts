import { ModelStatusEnum, ProjectTypeEnum } from "@repo/schema";
import * as p from "drizzle-orm/pg-core";
import { id, timestamps } from "../helpers";
import { modelOutputTypeEnum } from "./model-output";
import { projectTable } from "./project";

export const modelStatusEnum = p.pgEnum("model_status_enum", [
  ModelStatusEnum.DRAFT,
  ModelStatusEnum.TRAINING,
  ModelStatusEnum.CONVERTING,
  ModelStatusEnum.DONE,
  ModelStatusEnum.ERROR,
]);

export const modelTrainingTypeEnum = p.pgEnum("model_training_type_enum", [
  ProjectTypeEnum.CLASSIFICATION,
  ProjectTypeEnum.DETECTION,
  ProjectTypeEnum.SEGMENTATION,
]);

export const modelTable = p.pgTable("model", {
  id,
  name: p.varchar("name", { length: 256 }).notNull(),
  epochs: p.integer("epochs").notNull(),
  outputTypes: modelOutputTypeEnum("output_types").array().notNull(),
  trainingType: modelTrainingTypeEnum("training_type").notNull(),
  annotationsUsed: modelTrainingTypeEnum("annotations_used").array().notNull(),
  splitTrain: p.integer("split_train").notNull(),
  splitValidate: p.integer("split_validate").notNull(),
  splitTest: p.integer("split_test").notNull(),
  customHyperparams: p.jsonb("custom_hyperparams").notNull().default({}),
  status: modelStatusEnum("status").notNull(),
  errorMessage: p.text("error_message"),
  projectId: p
    .integer("project_id")
    .references(() => projectTable.id, { onDelete: "cascade" })
    .notNull(),
  ...timestamps,
});
