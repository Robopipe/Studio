import * as p from 'drizzle-orm/pg-core'
import { createdAt, id, timestamps } from '../helpers'
import { projectTable } from './project'
import { ModelStatusEnum } from "@repo/schema";
import { modelOutputTypeEnum } from "./model-output";

export const modelStatusEnum = p.pgEnum("model_status_enum", [ModelStatusEnum.DRAFT, ModelStatusEnum.TRAINING, ModelStatusEnum.CONVERTING, ModelStatusEnum.DONE])

export const modelTable = p.pgTable("model", {
  id,
  name: p.varchar("name", {length: 256}).notNull(),
  epochs: p.integer("epochs").notNull(),
  outputTypes: modelOutputTypeEnum("output_types").array().notNull(),
  splitTrain: p.integer('split_train').notNull(),
  splitValidate: p.integer('split_validate').notNull(),
  splitTest: p.integer('split_test').notNull(),
  status: modelStatusEnum("status").notNull(),
  projectId: p.integer("project_id").references(() => projectTable.id, {onDelete: 'cascade'}).notNull(),
  ...timestamps
})
