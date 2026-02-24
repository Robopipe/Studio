import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { dashboardConfigurationTable } from "@repo/database";
import { DashboardConfigurationItemSelect } from "./dashboard-configuration-item";

export type DashboardConfigurationSelect = InferSelectModel<typeof dashboardConfigurationTable>
export type DashboardConfigurationWithItemsSelect = DashboardConfigurationSelect & { items: DashboardConfigurationItemSelect[] }
export type DashboardConfigurationInsert = Omit<InferInsertModel<typeof dashboardConfigurationTable>, 'id' | 'createdAt' | 'updatedAt'>
export type DashboardConfigurationUpdate = Partial<Omit<InferInsertModel<typeof dashboardConfigurationTable>, 'id' | 'createdAt' | 'updatedAt'>>
