import * as p from "drizzle-orm/pg-core";
import { id, timestamps } from "../helpers";

export const organizationTable = p.pgTable("organization", {
  id,
  name: p.varchar({ length: 256 }).notNull(),
  ...timestamps
})
