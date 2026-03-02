import {
  dashboardConfigurationWithItemsSchema,
  labelSchema,
} from "@repo/schema";
import z from "zod";

export const dashboardConfigurationSchema =
  dashboardConfigurationWithItemsSchema.extend({
    labels: z.array(labelSchema),
  });
export type DashboardConfiguration = z.infer<
  typeof dashboardConfigurationSchema
>;

export const deployDashboardResponseSchema = z.object({
  dashboard_url: z.string(),
});
export type DeployDashboardResponse = z.infer<
  typeof deployDashboardResponseSchema
>;
