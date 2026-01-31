import * as p from "drizzle-orm/pg-core";
import { id, timestamps } from "../helpers";
import { projectTable } from "./project";
import { TaskFileTypeEnum, TaskStatusEnum } from "@repo/schema";

export const taskStatusEnum = p.pgEnum("task_status_enum", [TaskStatusEnum.TODO, TaskStatusEnum.DONE]);
export const taskFileTypeEnum = p.pgEnum("task_file_type_enum", [TaskFileTypeEnum.GS])


export const taskTable = p.pgTable("task", {
  id,
  projectId: p
    .integer("project_id")
    .references(() => projectTable.id, { onDelete: "cascade" })
    .notNull(),
  fileType: taskFileTypeEnum("file_type").notNull(),
  filePath: p.varchar("file_path", {length: 256}).notNull(),
  width: p.integer("width").notNull(),
  height: p.integer("height").notNull(),
  status: taskStatusEnum("status").notNull(),
  ...timestamps,
});
