import z from "zod";
import {
  createDashboardConfigurationSchema,
  updateDashboardConfigurationSchema,
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
export type UpdateDashboardConfiguration = z.infer<
  typeof updateDashboardConfigurationSchema
>;

export type DashboardEvaluation = z.infer<typeof dashboardEvaluationSchema>;
export type UpsertDashboardEvaluation = z.infer<
  typeof upsertDashboardEvaluationSchema
>;
