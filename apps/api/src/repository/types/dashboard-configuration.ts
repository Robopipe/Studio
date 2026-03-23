import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { dashboardConfigurationTable } from "@repo/database";

export type DashboardConfigurationSelect = InferSelectModel<typeof dashboardConfigurationTable>
export type DashboardConfigurationInsert = Omit<InferInsertModel<typeof dashboardConfigurationTable>, 'id' | 'createdAt' | 'updatedAt'>
export type DashboardConfigurationUpdate = Partial<Omit<InferInsertModel<typeof dashboardConfigurationTable>, 'id' | 'createdAt' | 'updatedAt'>>
