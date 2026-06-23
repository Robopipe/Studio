import * as p from "drizzle-orm/pg-core";
import { id } from "../helpers/id";
import { createdAt } from "../helpers/timestamps";
import { userTable } from "./user";

export const emailVerificationTable = p.pgTable("email_verification", {
  id,
  token: p.varchar("token", { length: 512 }).notNull().unique(),
  userId: p.integer("user_id").references(() => userTable.id, { onDelete: "cascade" }).notNull(),
  expiresAt: p.timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: p.timestamp("used_at", { withTimezone: true }),
  createdAt,
});
