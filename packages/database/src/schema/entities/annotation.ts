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
  taskId: p.integer("task_id").references(() => taskTable.id, {onDelete: 'cascade'}).notNull(),
  authorId: p.integer("author_id").references(() => userTable.id, {onDelete:'set null'}),
  ...timestamps
})
