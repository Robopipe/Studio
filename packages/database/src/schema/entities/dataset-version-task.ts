import * as p from "drizzle-orm/pg-core";
import { datasetVersionTable } from "./dataset-version";
import { taskTable } from "./task";

export const datasetVersionTaskTable = p.pgTable("dataset_version_task", {
  datasetVersionId: p.integer("dataset_version_id").references(() => datasetVersionTable.id, { onDelete: "cascade" }).notNull(),
  taskId: p.integer("task_id").references(() => taskTable.id, { onDelete: "cascade" }).notNull(),
}, (t) => [p.primaryKey({ columns: [t.datasetVersionId, t.taskId] })]);
