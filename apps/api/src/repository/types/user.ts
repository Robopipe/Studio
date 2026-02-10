import { userTable } from "@repo/database";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export type UserSelect = Omit<InferSelectModel<typeof userTable>, 'password'>
export type UserInsert = InferInsertModel<typeof userTable>
export type UserUpdate = Partial<Pick<UserInsert, "cameraApiUrl" | "fullName">>