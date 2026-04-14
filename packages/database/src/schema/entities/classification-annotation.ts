import * as p from 'drizzle-orm/pg-core'
import { id } from "../helpers";
import { taskTable } from "./task";
import { projectLabelTable } from "./project-label";

export const classificationAnnotationTable = p.pgTable("classification_annotation", {
  id,
  taskId: p.integer("task_id").references(() => taskTable.id, {onDelete: 'cascade'}).notNull(),
  labelId: p.integer("label_id").references(() => projectLabelTable.id, {onDelete: 'cascade'}).notNull(),
}, (t) => [
  p.unique().on(t.taskId, t.labelId),
])
