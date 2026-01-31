import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { modelLogTable } from "@repo/database";

export type ModelLogSelect = InferSelectModel<typeof modelLogTable>
export type ModelLogInsert = InferInsertModel<typeof modelLogTable>
