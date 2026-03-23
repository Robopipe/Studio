import {
  DashboardConfigurationLineDirectionEnum,
  DashboardConfigurationLineFlowEnum,
  evalLimitSchema,
  evalLogicNodeSchema,
  labelSchema,
} from "@repo/schema";
import z from "zod";

export const cameraApiEvalThresholdSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  value: z.number(),
  testCaseId: z.string(),
});
export type CameraApiEvalThreshold = z.infer<typeof cameraApiEvalThresholdSchema>;

export const cameraApiEvalTestCaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  severity: z.string(),
  limits: evalLimitSchema.array(),
  logicNodes: evalLogicNodeSchema.array(),
  thresholds: cameraApiEvalThresholdSchema.array(),
});
export type CameraApiEvalTestCase = z.infer<typeof cameraApiEvalTestCaseSchema>;

export const cameraApiDashboardConfigSchema = z.object({
  id: z.number(),
  name: z.string(),
  lineDirection: z.nativeEnum(DashboardConfigurationLineDirectionEnum),
  linePosition: z.number(),
  lineFlow: z.nativeEnum(DashboardConfigurationLineFlowEnum),
  testCases: cameraApiEvalTestCaseSchema.array(),
  labels: labelSchema.array(),
  remoteBackendUrl: z.string().nullable().optional(),
});
export type CameraApiDashboardConfig = z.infer<typeof cameraApiDashboardConfigSchema>;

export const deployDashboardResponseSchema = z.object({
  dashboard_url: z.string(),
});
export type DeployDashboardResponse = z.infer<typeof deployDashboardResponseSchema>;
