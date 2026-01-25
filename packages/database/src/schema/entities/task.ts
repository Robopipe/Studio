import * as p from 'drizzle-orm/pg-core'
import { id, timestamps } from '../helpers'
import { projectTable } from './project'
import { fileTable } from './file'

// TODO: Map to zod/enum
export const taskStatusEnum = p.pgEnum("task_status_enum", ["draft", "active"])

export const taskTable = p.pgTable("task", {
  id,
  projectId: p.varchar('project_id', {length: 256}).references(() => projectTable.id, {onDelete: 'cascade'}).notNull(),
  fileId: p.varchar("file_id", {length: 256}).references(() => fileTable.id, {onDelete: 'cascade'}).notNull(), // TODO: Can file be deleted before task?
  status: taskStatusEnum("status").notNull(),
  ...timestamps
})
