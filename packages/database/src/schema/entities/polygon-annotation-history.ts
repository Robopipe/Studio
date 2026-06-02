import * as p from 'drizzle-orm/pg-core'
import { id } from "../helpers";
import { taskTable } from "./task";
import { userTable } from "./user";
import { polygonAnnotationTable } from "./polygon-annotation";
import { annotationHistoryActionEnum } from "./rectangle-annotation-history";

export const polygonAnnotationHistoryTable = p.pgTable("polygon_annotation_history", {
  id,
  taskId: p.integer("task_id").references(() => taskTable.id, { onDelete: 'cascade' }).notNull(),
  annotationId: p.integer("annotation_id").references(() => polygonAnnotationTable.id, { onDelete: 'cascade' }).notNull(),
  userId: p.integer("user_id").references(() => userTable.id, { onDelete: 'set null' }),
  action: annotationHistoryActionEnum("action").notNull(),
  createdAt: p.timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  snapshot: p.jsonb("snapshot").notNull(),
}, (t) => [
  p.index("poly_anno_history_annotation_id_idx").on(t.annotationId),
  p.index("poly_anno_history_task_id_idx").on(t.taskId),
])
