import * as p from 'drizzle-orm/pg-core'
import { createdAt, id } from '../helpers'
import { userTable } from './user'
import { taskTable } from './task'

export const taskCommentTable = p.pgTable("task_comment",{
  id,
  content: p.text("content").notNull(),
  taskId: p.varchar('task_id', {length: 256}).references(() => taskTable.id, {onDelete: 'cascade'}).notNull(),
  authorId: p.varchar('author_id', {length: 256}).references(() => userTable.id, {onDelete: 'set null'}),
  createdAt
})
