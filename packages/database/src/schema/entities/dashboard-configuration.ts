import * as p from 'drizzle-orm/pg-core'
import { createdAt, id, updatedAt } from "../helpers";
import { projectTable } from "./project";

export const dashboardConfigurationTable = p.pgTable("dashboard_configuration", {
  id,
  name: p.varchar("name", {length: 256}).notNull(),
  projectId: p.integer("project_id").references(() => projectTable.id, {onDelete: 'cascade'}).notNull(),
  createdAt,
  updatedAt
})
