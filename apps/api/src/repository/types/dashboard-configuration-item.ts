import { dashboardConfigurationItemTable } from "@repo/database";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { ProjectLabelSelect } from "./project-label";

export type DashboardConfigurationItemSelect = InferSelectModel<
  typeof dashboardConfigurationItemTable
> & {
  targetLabel: ProjectLabelSelect;
  targetParentLabel: ProjectLabelSelect | null;
};
export type DashboardConfigurationItemInsert = Omit<
  InferInsertModel<typeof dashboardConfigurationItemTable>,
  "id" | "createdAt" | "updatedAt"
>;
export type DashboardConfigurationItemUpdate = Partial<
  Omit<
    InferInsertModel<typeof dashboardConfigurationItemTable>,
    "id" | "createdAt" | "updatedAt"
  >
>;
