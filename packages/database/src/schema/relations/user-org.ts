import { defineRelationsPart } from "drizzle-orm";
import * as schema from '../entities'


export const relationUserOrgPart = defineRelationsPart(schema, (r) => ({
  userTable: {
    memberships: r.many.organizationMemberTable(),
    passwordResets: r.many.passwordResetTable(),
  },
  passwordResetTable: {
    user: r.one.userTable({
      from: r.passwordResetTable.userId,
      to: r.userTable.id,
    }),
  },
  organizationMemberTable: {
    user: r.one.userTable({
      from: r.organizationMemberTable.userId,
      to: r.userTable.id,
    }),
    organization: r.one.organizationTable({
      from: r.organizationMemberTable.organizationId,
      to: r.organizationTable.id,
    }),
  },
  invitationTable: {
    organization: r.one.organizationTable({
      from: r.invitationTable.organizationId,
      to: r.organizationTable.id,
    }),
    invitedBy: r.one.userTable({
      from: r.invitationTable.invitedById,
      to: r.userTable.id,
    }),
  },
  organizationTable: {
    members: r.many.organizationMemberTable(),
    invitations: r.many.invitationTable(),
    projects: r.many.projectTable(),
  },
}))
