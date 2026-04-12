import * as p from "drizzle-orm/pg-core";
import { id, timestamps } from "../helpers";
import { projectTable } from "./project";

export const capturedVideoTable = p.pgTable("captured_video", {
  id,
  projectId: p
    .integer("project_id")
    .references(() => projectTable.id, { onDelete: "cascade" })
    .notNull(),
  fileUrl: p.varchar("file_url", { length: 512 }).notNull(),
  thumbnailUrl: p.varchar("thumbnail_url", { length: 512 }).notNull(),
  durationMs: p.integer("duration_ms").notNull(),
  fileSizeBytes: p.integer("file_size_bytes").notNull(),
  ...timestamps,
});
