import * as p from 'drizzle-orm/pg-core'
import { id, timestamps } from '../helpers'
import { taskTable } from './task'
import { userTable } from './user'

// TODO: Map to zed/enum
export const annotationStatusEnum = p.pgEnum("annotation_status_enum", ["draft", "active"])

export const annotationTable = p.pgTable("annotation", {
  id,
  status: annotationStatusEnum("status").notNull(),
  data: p.text("data").notNull(),
  taskId: p.varchar("task_id", {length: 256}).references(() => taskTable.id, {onDelete: 'cascade'}).notNull(),
  authorId: p.varchar("author_id", {length: 256}).references(() => userTable.id, {onDelete:'set null'}),
  ...timestamps
})
