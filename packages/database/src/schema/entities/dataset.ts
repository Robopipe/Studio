import * as p from "drizzle-orm/pg-core";
import { id, timestamps } from "../helpers";
import { projectTable } from "./project";

export const datasetTable = p.pgTable("dataset", {
  id,
  name: p.varchar("name", { length: 256 }).notNull(),
  projectId: p
    .integer("project_id")
    .references(() => projectTable.id, { onDelete: "cascade" })
    .notNull(),
  ...timestamps,
});
