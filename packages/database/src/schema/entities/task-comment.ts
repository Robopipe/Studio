import * as p from 'drizzle-orm/pg-core'
import { createdAt, id } from '../helpers'
import { userTable } from './user'
import { taskTable } from './task'

export const taskCommentTable = p.pgTable("task_comment",{
  id,
  content: p.text("content").notNull(),
  taskId: p.integer('task_id').references(() => taskTable.id, {onDelete: 'cascade'}).notNull(),
  authorId: p.integer('author_id').references(() => userTable.id, {onDelete: 'set null'}),
  createdAt
})
