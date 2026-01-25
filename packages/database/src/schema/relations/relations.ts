import { defineRelations } from "drizzle-orm";
import * as schema from '../entities'

export const relations = defineRelations(schema, (r) => ({
  userTable: {
    organization: r.one.organizationTable({
      from: r.userTable.organizationId,
      to: r.organizationTable.id
    })
  },
  organizationTable: {
    users: r.many.userTable()
  }
}))
