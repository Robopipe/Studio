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

// Types for the deploy payload sent to the camera Python API (DashboardConfig)

export type DeployLabel = {
  id: number;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type DeployEvalThreshold = {
  id: string;
  name: string;
  value: number;
  color: string;
  testCaseId: string;
};

export type DeployEvalLimitItem = {
  id: string;
  limitFrom: number | null;
  limitTo: number | null;
  parameter: string;
  operator: string;
};

export type DeployEvalLimit = {
  id: string;
  name: string;
  targetLabel: DeployLabel;
  targetParentLabel: DeployLabel | null;
  limitItems: DeployEvalLimitItem[];
};

export type DeployEvalTestCase = {
  id: string;
  name: string;
  type: string;
  severity: string;
  limits: DeployEvalLimit[];
  logicNodes: unknown[];
  thresholds: DeployEvalThreshold[];
};

export type DeployDashboardConfig = {
  id: number;
  name: string;
  lineDirection: string;
  linePosition: number;
  lineFlow: string;
  testCases: DeployEvalTestCase[];
  labels: DeployLabel[];
};
