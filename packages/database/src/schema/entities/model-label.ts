import * as p from 'drizzle-orm/pg-core'
import { modelTable } from "./model";
import { projectLabelTable } from "./project-label";

export const modelLabelTable = p.pgTable("model_label", {
  modelId: p.integer("model_id").references(() => modelTable.id, {onDelete: 'cascade'}).notNull(),
  labelId: p.integer("label_id").references(() => projectLabelTable.id, {onDelete: 'cascade'}).notNull()
}, (t) => [p.primaryKey({columns: [t.modelId, t.labelId]})])
