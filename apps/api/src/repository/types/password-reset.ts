import { passwordResetTable } from "@repo/database";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export type PasswordResetSelect = InferSelectModel<typeof passwordResetTable>;
export type PasswordResetInsert = InferInsertModel<typeof passwordResetTable>;
