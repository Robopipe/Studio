import * as p from 'drizzle-orm/pg-core'
import { id } from "../helpers";
import { taskTable } from "./task";
import { userTable } from "./user";
import { classificationAnnotationTable } from "./classification-annotation";
import { annotationHistoryActionEnum } from "./rectangle-annotation-history";

export const classificationAnnotationHistoryTable = p.pgTable("classification_annotation_history", {
  id,
  taskId: p.integer("task_id").references(() => taskTable.id, { onDelete: 'cascade' }).notNull(),
  annotationId: p.integer("annotation_id").references(() => classificationAnnotationTable.id, { onDelete: 'cascade' }).notNull(),
  userId: p.integer("user_id").references(() => userTable.id, { onDelete: 'set null' }),
  action: annotationHistoryActionEnum("action").notNull(),
  createdAt: p.timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  snapshot: p.jsonb("snapshot").notNull(),
}, (t) => [
  p.index("cls_anno_history_annotation_id_idx").on(t.annotationId),
  p.index("cls_anno_history_task_id_idx").on(t.taskId),
])
