import { dashboardConfigurationSchema, labelSchema } from "@repo/schema";
import z from "zod";

export const cameraApiDashboardConfigurationSchema =
  dashboardConfigurationSchema.extend({
    labels: z.array(labelSchema),
  });
export type DashboardConfiguration = z.infer<
  typeof cameraApiDashboardConfigurationSchema
>;

export const deployDashboardResponseSchema = z.object({
  dashboard_url: z.string(),
});
export type DeployDashboardResponse = z.infer<
  typeof deployDashboardResponseSchema
>;
