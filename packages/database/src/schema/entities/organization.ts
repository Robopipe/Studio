import { pgTable, varchar } from "drizzle-orm/pg-core";
import { id, timestamps } from "../helpers";

export const organizationTable = pgTable("organization", {
  id,
  name: varchar({ length: 256 }).notNull(),
  ...timestamps
})
