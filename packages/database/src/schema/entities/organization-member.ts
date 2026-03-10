import * as p from "drizzle-orm/pg-core";
import { OrgMemberRoleEnum } from "@repo/schema";
import { id } from "../helpers/id";
import { createdAt, updatedAt } from "../helpers/timestamps";
import { userTable } from "./user";
import { organizationTable } from "./organization";

export const orgMemberRoleEnum = p.pgEnum("org_member_role_enum", [
  OrgMemberRoleEnum.OWNER,
  OrgMemberRoleEnum.ADMIN,
  OrgMemberRoleEnum.MEMBER,
]);

export const organizationMemberTable = p.pgTable("organization_member", {
  id,
  userId: p.integer("user_id")
    .references(() => userTable.id, { onDelete: "cascade" })
    .notNull(),
  organizationId: p.integer("organization_id")
    .references(() => organizationTable.id, { onDelete: "cascade" })
    .notNull(),
  role: orgMemberRoleEnum("role").notNull().default(OrgMemberRoleEnum.MEMBER),
  createdAt,
  updatedAt,
}, (t) => [p.unique().on(t.userId, t.organizationId)]);
