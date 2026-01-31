import * as p from 'drizzle-orm/pg-core'
import { id } from "../helpers";
import { taskTable } from "./task";
import { projectLabelTable } from "./project-label";

export const polygonAnnotationTable = p.pgTable("polygon_annotation", {
  id,
  taskId: p.integer("task_id").references(() => taskTable.id, {onDelete: 'cascade'}).notNull(),
  labelId: p.integer("label_id").references(() => projectLabelTable.id, {onDelete: 'cascade'}).notNull(),
  value: p.point({mode: 'tuple'}).array().notNull()
})
