import z from "zod";
import {
  createDashboardConfigurationItemSchema,
  createDashboardConfigurationSchema,
  dashboardConfigurationItemSchema,
  dashboardConfigurationSchema,
  dashboardConfigurationWithItemsSchema,
  dashboardEvaluationSchema,
  limitPairSchema,
  upsertDashboardEvaluationSchema,
} from "./dashboard.schema";

export type LimitPair = z.infer<typeof limitPairSchema>;
export type DashboardConfigurationItem = z.infer<
  typeof dashboardConfigurationItemSchema
>;
export type CreateDashboardConfigurationItem = z.infer<
  typeof createDashboardConfigurationItemSchema
>;
export type UpdateDashboardConfigurationItem = CreateDashboardConfigurationItem;

export type DashboardConfiguration = z.infer<
  typeof dashboardConfigurationSchema
>;
export type DashboardConfigurationWithItems = z.infer<
  typeof dashboardConfigurationWithItemsSchema
>;
export type CreateDashboardConfiguration = z.infer<
  typeof createDashboardConfigurationSchema
>;
export type UpdateDashboardConfiguration = CreateDashboardConfiguration;

export type DashboardEvaluation = z.infer<typeof dashboardEvaluationSchema>;
export type UpsertDashboardEvaluation = z.infer<
  typeof upsertDashboardEvaluationSchema
>;
