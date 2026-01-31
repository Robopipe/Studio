import * as p from 'drizzle-orm/pg-core'
import { id, timestamps } from "../helpers";
import { projectTable } from "./project";

export const projectLabelTable = p.pgTable("project_label", {
  id,
  title: p.varchar("title", {length: 256}).notNull(),
  name: p.varchar("name", {length: 256}).notNull(),
  color: p.varchar("color", {length: 50}).notNull(),
  projectId: p.integer("project_id").references(() => projectTable.id, {onDelete: 'cascade'}).notNull(),
  ...timestamps
}, (t) => [p.unique().on(t.name, t.projectId)])
