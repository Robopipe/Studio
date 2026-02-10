import * as p from "drizzle-orm/pg-core";
import { id } from "../helpers/id";
import { timestamps } from "../helpers/timestamps";
import { organizationTable } from "./organization";

export const userTable = p.pgTable("user", {
  id,
  username: p.varchar("username", { length: 256 }).notNull(),
  email: p.varchar("email", { length: 256 }).notNull().unique(),
  fullName: p.varchar("full_name", { length: 256 }).notNull(),
  password: p.text("password").notNull(),
  cameraApiUrl: p.text("camera_api_url").notNull().default("https://robopipe-1.local"),
  organizationId: p.integer("organization_id").references(() => organizationTable.id, {onDelete: 'cascade'}).notNull(),
  ...timestamps,
});
