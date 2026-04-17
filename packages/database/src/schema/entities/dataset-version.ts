import * as p from "drizzle-orm/pg-core";
import { id, timestamps } from "../helpers";
import { datasetTable } from "./dataset";

export const datasetVersionTable = p.pgTable("dataset_version", {
  id,
  datasetId: p
    .integer("dataset_id")
    .references(() => datasetTable.id, { onDelete: "cascade" })
    .notNull(),
  version: p.integer("version").notNull(),
  ...timestamps,
}, (t) => [p.unique().on(t.datasetId, t.version)]);
