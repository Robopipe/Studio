import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { dashboardEvaluationTable } from "@repo/database";

export type DashboardEvaluationSelect = InferSelectModel<typeof dashboardEvaluationTable>
export type DashboardEvaluationInsert = Omit<InferInsertModel<typeof dashboardEvaluationTable>, 'id' | 'createdAt' | 'updatedAt'>
export type DashboardEvaluationUpdate = Partial<Omit<InferInsertModel<typeof dashboardEvaluationTable>, 'id' | 'createdAt' | 'updatedAt'>>
