import * as p  from 'drizzle-orm/pg-core'
import { createdAt, id } from '../helpers'
import { projectTable } from './project'
import { InferSelectModel } from 'drizzle-orm'

// TODO: Map to zed/enum
export const fileTypeEnum = p.pgEnum("file_type_enum", ["local", "gs"])

export const fileTable = p.pgTable("file", {
  id,
  type: fileTypeEnum("type").notNull(),
  path: p.varchar("path", {length: 256}).notNull(),
  // TODO: File metadata??
  projectId: p.integer("project_id").references(() => projectTable.id, {onDelete: 'cascade'}).notNull(),
  createdAt
})
