import * as p from 'drizzle-orm/pg-core'
import { id } from "../helpers";
import { ModelOutputTypeEnum, TaskFileTypeEnum } from "@repo/schema";
import { modelTable } from "./model";


export const modelOutputTypeEnum = p.pgEnum("model_output_type_enum", [ModelOutputTypeEnum.RAW, ModelOutputTypeEnum.RVC3, ModelOutputTypeEnum.RVC4])
export const modelOutputFileTypeEnum = p.pgEnum("model_output_file_type_enum", [TaskFileTypeEnum.GS])

export const modelOutputTable = p.pgTable("model_output", {
  id,
  type: modelOutputTypeEnum("type").notNull(),
  filePath: p.varchar("file_path", {length: 256}).notNull(),
  fileType: modelOutputFileTypeEnum("file_type").notNull(),
  modelId: p.integer("model_id").references(() => modelTable.id, {onDelete: 'cascade'}).notNull()
}, (t) => [p.unique().on(t.modelId, t.type)])
