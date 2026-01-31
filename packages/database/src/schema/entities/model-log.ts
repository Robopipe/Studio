import * as p from 'drizzle-orm/pg-core'
import { createdAt, id } from "../helpers";
import { modelTable } from "./model";
import { ModelLogMetrics } from "@repo/schema";

export const modelLogTable = p.pgTable("model_log", {
  id,
  modelId: p.integer("model_id").references(() => modelTable.id, {onDelete: 'cascade'}).notNull(),
  epoch: p.integer("epoch").notNull(),
  metrics: p.jsonb("metrics").notNull().$type<ModelLogMetrics>(),
  createdAt,
})
