import * as p from 'drizzle-orm/pg-core'
import { createdAt, id } from "../helpers";
import { modelTable } from "./model";

export const modelLogTable = p.pgTable("model_log", {
  id,
  modelId: p.integer("model_id").references(() => modelTable.id, {onDelete: 'cascade'}).notNull(),
  epoch: p.integer("epoch"),
  metrics: p.jsonb("metrics").notNull(),
  createdAt,
})
