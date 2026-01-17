import { varchar, pgTable, text } from "drizzle-orm/pg-core";
import { id } from "../helpers/id";
import { timestamps } from "../helpers/timestamps";

export const users = pgTable("users", {
  id,
  ...timestamps,
  username: varchar({ length: 256 }).notNull(),
  email: varchar({ length: 256 }).notNull().unique(),
  fullName: varchar({ length: 256 }).notNull(),
  password: text().notNull(),
});
