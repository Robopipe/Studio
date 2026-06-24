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
  ...timestamps,
}, (t) => [
  p.unique().on(t.projectId, t.iid),
  p.index("task_project_created_idx").on(t.projectId, t.createdAt),
]);
