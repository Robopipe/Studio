import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { runConfigurationTable } from "@repo/database";

export type RunConfigurationSelect = InferSelectModel<typeof runConfigurationTable>
export type RunConfigurationInsert = Omit<InferInsertModel<typeof runConfigurationTable>, 'id' | 'createdAt' | 'updatedAt'>
export type RunConfigurationUpdate = Partial<Omit<InferInsertModel<typeof runConfigurationTable>, 'id' | 'createdAt' | 'updatedAt'>>
