import * as p from "drizzle-orm/pg-core";
import { id, timestamps } from "../helpers";
import { projectTable } from "./project";

/**
 * Holds an iid reservation + signed-URL upload path while the browser uploads
 * an image directly to GCS. Once the browser calls confirm, the row is
 * promoted to a real task row and deleted here.
 */
export const pendingTaskTable = p.pgTable("pending_task", {
  id,
  iid: p.varchar("iid", { length: 256 }).notNull(),
  projectId: p
    .integer("project_id")
    .references(() => projectTable.id, { onDelete: "cascade" })
    .notNull(),
  objectPath: p.varchar("object_path", { length: 512 }).notNull(),
  capturedAt: p.timestamp("captured_at", { withTimezone: true }),
  ...timestamps,
}, (t) => [p.unique().on(t.projectId, t.iid)]);
