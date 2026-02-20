import z from "zod";
import {
  createDashboardConfigurationItemSchema,
  dashboardConfigurationItemSchema,
} from "./dashboard.schema";

export type DashboardConfigurationItem = z.infer<typeof dashboardConfigurationItemSchema>;
export type CreateDashboardConfigurationItem = z.infer<typeof createDashboardConfigurationItemSchema>;
export type UpdateDashboardConfigurationItem = CreateDashboardConfigurationItem;
