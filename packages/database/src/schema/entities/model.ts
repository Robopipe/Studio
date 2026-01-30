import * as p from 'drizzle-orm/pg-core'
import { createdAt, id } from '../helpers'
import { projectTable } from './project'

export const modelTable = p.pgTable("model", {
  id,
  name: p.varchar("name", {length: 256}).notNull(),
  projectId: p.varchar("project_id", {length: 256}).references(() => projectTable.id, {onDelete: 'cascade'}).notNull(),
  createdAt,
})
