import { dashboardConfigurationSchema, labelSchema } from "@repo/schema";
import z from "zod";
import type { NNConfig } from "./nn";

export const cameraApiDashboardConfigurationSchema =
  dashboardConfigurationSchema.extend({
    labels: z.array(labelSchema),
  });
export type DashboardConfiguration = z.infer<
  typeof cameraApiDashboardConfigurationSchema
>;

export const deployDashboardResponseSchema = z.object({
  dashboard_url: z.string(),
  configs_count: z.number(),
});
export type DeployDashboardResponse = z.infer<
  typeof deployDashboardResponseSchema
>;

export type DeployConfigEntry = {
  dashboard_config: DeployDashboardConfig;
  nn_config: NNConfig;
};

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
  severity: string | null;
  targetLabel: DeployLabel;
  targetParentLabel: DeployLabel | null;
  limitItems: DeployEvalLimitItem[];
};

export type DeployEvalTestCase = {
  id: string;
  name: string;
  type: string;
  severity: string | null;
  enabled: boolean;
  limits: DeployEvalLimit[];
  logicNodes: unknown[];
  thresholds: DeployEvalThreshold[];
};

export type DeployMasterThreshold = {
  id: string;
  name: string;
  value: number;
  color: string;
};

export type DeployDashboardConfig = {
  id: number;
  name: string;
  projectId: number;
  projectName: string;
  zoneDirection: string;
  zoneCenter: number;
  zoneThickness: number;
  optimistic: boolean;
  testCases: DeployEvalTestCase[];
  thresholds: DeployMasterThreshold[];
  labels: DeployLabel[];
};
