import { sql } from "drizzle-orm";
import { timestamp } from "drizzle-orm/pg-core";

export const createdAt = timestamp("created_at",{ withTimezone: true })
  .notNull()
  .defaultNow();

export const updatedAt = timestamp("updated_at", { withTimezone: true })
  .notNull()
  .defaultNow()
  .$onUpdate(() => sql`NOW()`);

export const deletedAt = timestamp("deleted_at",{ withTimezone: true })

export const timestamps = {
  createdAt,
  updatedAt,
  deletedAt
};
