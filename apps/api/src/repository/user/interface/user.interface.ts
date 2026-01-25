import { userTable } from "@repo/database/schema";
import { InferSelectModel } from "drizzle-orm";

export type UserSelectModel = InferSelectModel<typeof userTable>
