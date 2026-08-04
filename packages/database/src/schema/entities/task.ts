import { sql } from "drizzle-orm";
import * as p from "drizzle-orm/pg-core";
import { id, timestamps } from "../helpers";
import { projectTable } from "./project";
import { userTable } from "./user";
import { TaskFileTypeEnum, TaskStatusEnum } from "@repo/schema";

export const taskStatusEnum = p.pgEnum("task_status_enum", [TaskStatusEnum.TODO, TaskStatusEnum.DONE]);
export const taskFileTypeEnum = p.pgEnum("task_file_type_enum", [TaskFileTypeEnum.GS])


export const taskTable = p.pgTable("task", {
  id,
  iid: p.varchar("iid", {length: 256}).notNull(),
  projectId: p
    .integer("project_id")
    .references(() => projectTable.id, { onDelete: "cascade" })
    .notNull(),
  fileType: taskFileTypeEnum("file_type").notNull(),
  filePath: p.varchar("file_path", {length: 256}).notNull(),
  thumbnailUrl: p.varchar("thumbnail_url", {length: 256}).notNull(),
  width: p.integer("width").notNull(),
  height: p.integer("height").notNull(),
  status: taskStatusEnum("status").notNull(),
  annotationCount: p.integer("annotation_count").notNull().default(0),
  updatedBy: p.integer("updated_by").references(() => userTable.id, { onDelete: "set null" }),
  // Per-task confidence-report scalars. Null until a report has been run.
  // Unannotated (TODO) tasks only ever get meanConfidence; the rest stay null.
  meanConfidence: p.real("mean_confidence"),
  /** Mean matched-TP IoU for the image. Null when no TP match. */
  meanIou: p.real("mean_iou"),
  /** Micro-averaged precision for the image: TP/(TP+FP) at IoU≥0.5. */
  precision: p.real("precision"),
  /** Micro-averaged recall for the image: TP/(TP+FN) at IoU≥0.5. */
  recall: p.real("recall"),
  // Task in another project this image was copied from ("import from project").
  // Null for regular captures. Points at the immediate parent only.
  sourceTaskId: p
    .integer("source_task_id")
    .references((): p.AnyPgColumn => taskTable.id, { onDelete: "set null" }),
  ...timestamps,
}, (t) => [
  p.unique().on(t.projectId, t.iid),
  p.index("task_project_created_idx").on(t.projectId, t.createdAt),
  // Partial so soft-deleting an imported task frees the slot for re-import.
  p.uniqueIndex("task_source_task_unique_idx")
    .on(t.projectId, t.sourceTaskId)
    .where(sql`${t.deletedAt} IS NULL`),
]);
