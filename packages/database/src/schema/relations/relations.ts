import { defineRelations } from "drizzle-orm";
import * as schema from '../entities'

export const relations = defineRelations(schema, (r) => ({
  userTable: {
    organization: r.one.organizationTable({
      from: r.userTable.organizationId,
      to: r.organizationTable.id
    }),
    comments: r.many.taskCommentTable(),
  },
  organizationTable: {
    users: r.many.userTable(),
    projects: r.many.projectTable()
  },
  projectTable: {
    organization: r.one.organizationTable({
      from: r.projectTable.organizationId,
      to: r.organizationTable.id
    }),
    tasks: r.many.taskTable(),
    files: r.many.fileTable()
  },
  taskTable: {
    project: r.one.projectTable({
      from: r.taskTable.projectId,
      to: r.projectTable.id
    }),
    comments: r.many.taskCommentTable(),
    annotations: r.many.annotationTable()
  },
  taskCommentTable: {
    task: r.one.taskTable({
      from: r.taskCommentTable.taskId,
      to: r.taskCommentTable.id
    }),
    author: r.one.userTable({
      from: r.taskCommentTable.authorId,
      to: r.userTable.id
    })
  },
  annotationTable: {
    task: r.one.taskTable({
      from: r.annotationTable.taskId,
      to: r.taskTable.id
    })
  },
  modelTable: {
    project: r.one.projectTable({
      from: r.modelTable.projectId,
      to: r.projectTable.id
    })
  }
}))
