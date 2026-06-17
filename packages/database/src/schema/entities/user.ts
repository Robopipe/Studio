import * as p from "drizzle-orm/pg-core";
import { id } from "../helpers/id";
import { timestamps } from "../helpers/timestamps";

export const userTable = p.pgTable("user", {
  id,
  username: p.varchar("username", { length: 256 }).notNull(),
  email: p.varchar("email", { length: 256 }).notNull().unique(),
  fullName: p.varchar("full_name", { length: 256 }).notNull(),
  password: p.text("password").notNull(),
  emailVerifiedAt: p.timestamp("email_verified_at", { withTimezone: true }),
  ...timestamps,
});
