import { defineRelationsPart } from "drizzle-orm";
import * as schema from '../entities'


export const relationUserOrgPart = defineRelationsPart(schema, (r) => ({
  userTable: {
    memberships: r.many.organizationMemberTable({
      from: r.userTable.id,
      to: r.organizationMemberTable.userId,
    }),
    passwordResets: r.many.passwordResetTable({
      from: r.userTable.id,
      to: r.passwordResetTable.userId,
    }),
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
    members: r.many.organizationMemberTable({
      from: r.organizationTable.id,
      to: r.organizationMemberTable.organizationId,
    }),
    invitations: r.many.invitationTable({
      from: r.organizationTable.id,
      to: r.invitationTable.organizationId,
    }),
    projects: r.many.projectTable({
      from: r.organizationTable.id,
      to: r.projectTable.organizationId,
    }),
  },
}))
