import * as p from 'drizzle-orm/pg-core'
import { id, timestamps } from '../helpers'
import { organizationTable } from './organization'

export const projectTable = p.pgTable("project", {
  id,
  name: p.varchar("name", {length:256}).notNull(),
  organizationId: p.integer("organization_id").references(() => organizationTable.id, {onDelete: 'cascade'}).notNull(),
  ...timestamps
})
