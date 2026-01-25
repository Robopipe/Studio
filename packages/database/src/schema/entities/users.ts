import { varchar, pgTable, text, integer } from "drizzle-orm/pg-core";
import { id } from "../helpers/id";
import { timestamps } from "../helpers/timestamps";
import { organizationTable } from "./organization";

export const userTable = pgTable("user", {
  id,
  username: varchar("username", { length: 256 }).notNull(),
  email: varchar("email", { length: 256 }).notNull().unique(),
  fullName: varchar("full_name", { length: 256 }).notNull(),
  password: text("password").notNull(),
  organizationId: integer("organization_id").references(() => organizationTable.id, {onDelete: 'cascade'}).notNull(),
  ...timestamps,
});
