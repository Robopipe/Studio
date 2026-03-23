import z from "zod";
import {
  createDashboardConfigurationSchema,
  dashboardConfigurationSchema,
  dashboardEvaluationSchema,
  upsertDashboardEvaluationSchema,
} from "./dashboard.schema";

export type DashboardConfiguration = z.infer<
  typeof dashboardConfigurationSchema
>;
export type CreateDashboardConfiguration = z.infer<
  typeof createDashboardConfigurationSchema
>;
export type UpdateDashboardConfiguration = CreateDashboardConfiguration;

export type DashboardEvaluation = z.infer<typeof dashboardEvaluationSchema>;
export type UpsertDashboardEvaluation = z.infer<
  typeof upsertDashboardEvaluationSchema
>;
