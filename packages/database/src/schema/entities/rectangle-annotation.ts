import * as p from 'drizzle-orm/pg-core'
import { id } from "../helpers";
import { taskTable } from "./task";
import { projectLabelTable } from "./project-label";


export const rectangleAnnotationTable = p.pgTable("rectangle_annotation", {
  id,
  taskId: p.integer("task_id").references(() => taskTable.id, {onDelete: 'cascade'}).notNull(),
  labelId: p.integer("label_id").references(() => projectLabelTable.id, {onDelete: 'cascade'}).notNull(),
  x: p.doublePrecision("x").notNull(),
  y: p.doublePrecision("y").notNull(),
  width: p.doublePrecision("width").notNull(),
  height: p.doublePrecision("height").notNull(),
  groupId: p.uuid("group_id"),
}, (t) => [
  p.index("rect_annotation_task_id_idx").on(t.taskId),
  p.index("rect_annotation_group_id_idx").on(t.groupId),
])
