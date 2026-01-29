import { userTable } from "@repo/database";
import { InferSelectModel } from "drizzle-orm";

export type UserSelect = Omit<InferSelectModel<typeof userTable>, 'password'>
