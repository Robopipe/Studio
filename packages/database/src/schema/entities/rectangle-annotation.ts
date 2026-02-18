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
})
