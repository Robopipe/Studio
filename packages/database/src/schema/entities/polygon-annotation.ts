import * as p from 'drizzle-orm/pg-core'
import { id } from "../helpers";
import { taskTable } from "./task";
import { projectLabelTable } from "./project-label";

export const polygonAnnotationTable = p.pgTable("polygon_annotation", {
  id,
  taskId: p.integer("task_id").references(() => taskTable.id, {onDelete: 'cascade'}).notNull(),
  labelId: p.integer("label_id").references(() => projectLabelTable.id, {onDelete: 'cascade'}).notNull(),
  value: p.point({mode: 'tuple'}).array().notNull(),
  groupId: p.uuid("group_id"),
}, (t) => [
  p.index("poly_annotation_task_id_idx").on(t.taskId),
  p.index("poly_annotation_group_id_idx").on(t.groupId),
])
