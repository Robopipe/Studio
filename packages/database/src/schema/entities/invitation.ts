import * as p from "drizzle-orm/pg-core";
import { InvitationStatusEnum } from "@repo/schema";
import { id } from "../helpers/id";
import { createdAt } from "../helpers/timestamps";
import { userTable } from "./user";
import { organizationTable } from "./organization";

export const invitationStatusEnum = p.pgEnum("invitation_status_enum", [
  InvitationStatusEnum.PENDING,
  InvitationStatusEnum.ACCEPTED,
  InvitationStatusEnum.DECLINED,
  InvitationStatusEnum.EXPIRED,
]);

export const invitationTable = p.pgTable("invitation", {
  id,
  email: p.varchar("email", { length: 256 }).notNull(),
  organizationId: p.integer("organization_id")
    .references(() => organizationTable.id, { onDelete: "cascade" })
    .notNull(),
  invitedById: p.integer("invited_by_id")
    .references(() => userTable.id, { onDelete: "cascade" })
    .notNull(),
  token: p.text("token").notNull().unique(),
  status: invitationStatusEnum("status").notNull().default(InvitationStatusEnum.PENDING),
  expiresAt: p.timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt,
});
