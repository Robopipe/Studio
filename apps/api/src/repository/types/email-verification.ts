import { emailVerificationTable } from "@repo/database";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export type EmailVerificationSelect = InferSelectModel<typeof emailVerificationTable>;
export type EmailVerificationInsert = InferInsertModel<typeof emailVerificationTable>;
