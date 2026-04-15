import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { pendingTaskTable } from "@repo/database";

export type PendingTaskSelect = InferSelectModel<typeof pendingTaskTable>;
export type PendingTaskInsert = InferInsertModel<typeof pendingTaskTable>;
