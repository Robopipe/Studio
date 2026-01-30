import * as p from "drizzle-orm/pg-core";
import { id, timestamps } from "../helpers";
import { projectTable } from "./project";
import { fileTable } from "./file";

// TODO: Map to zod/enum
export const taskStatusEnum = p.pgEnum("task_status_enum", ["draft", "active"]);

export const taskTable = p.pgTable("task", {
  id,
  projectId: p
    .integer("project_id")
    .references(() => projectTable.id, { onDelete: "cascade" })
    .notNull(),
  fileId: p
    .integer("file_id")
    .references(() => fileTable.id, { onDelete: "cascade" })
    .notNull(), // TODO: Can file be deleted before task?
  status: taskStatusEnum("status").notNull(),
  ...timestamps,
});
