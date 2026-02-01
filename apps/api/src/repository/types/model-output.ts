import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { modelOutputTable } from "@repo/database";

export type ModelOutputSelect = InferSelectModel<typeof modelOutputTable>
export type ModelOutputInsert = InferInsertModel<typeof modelOutputTable>
