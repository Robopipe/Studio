import * as p from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../helpers";
import { capturedVideoTable } from "./captured-video";
import { modelTable } from "./model";
import { projectTable } from "./project";

export const runConfigurationTable = p.pgTable("run_configuration", {
  id,
  projectId: p
    .integer("project_id")
    .references(() => projectTable.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  modelId: p
    .integer("model_id")
    .references(() => modelTable.id, { onDelete: "set null" }),
  streamName: p.varchar("stream_name", { length: 256 }),
  capturedVideoId: p
    .integer("captured_video_id")
    .references(() => capturedVideoTable.id, { onDelete: "set null" }),
  createdAt,
  updatedAt,
});
