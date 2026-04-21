import z from "zod";
import { timestampsSchema } from "../helpers";

export enum DashboardConfigurationZoneDirectionEnum {
  HORIZONTAL = "HORIZONTAL",
  VERTICAL = "VERTICAL",
}

export const dashboardConfigurationSchema = z.object({
  id: z.number(),
  name: z.string(),
  projectId: z.number(),
  zoneDirection: z.enum(DashboardConfigurationZoneDirectionEnum),
  zoneCenter: z.number(),
  zoneThickness: z.number(),
  optimistic: z.boolean(),
  modelId: z.number().nullable(),
  cameraMxid: z.string().nullable(),
  streamName: z.string().nullable(),
  capturedVideoId: z.number().nullable(),
  createdAt: timestampsSchema.createdAt,
  updatedAt: timestampsSchema.updatedAt,
});

export const createDashboardConfigurationSchema = z.object({
  name: z.string().min(1).max(256),
});

export const updateDashboardConfigurationSchema = z.object({
  name: z.string().min(1).max(256).optional(),
  modelId: z.number().nullable().optional(),
  zoneDirection: z.enum(DashboardConfigurationZoneDirectionEnum).optional(),
  zoneCenter: z.number().min(0).max(1).optional(),
  zoneThickness: z.number().min(0).max(1).optional(),
  optimistic: z.boolean().optional(),
  cameraMxid: z.string().nullable().optional(),
  streamName: z.string().nullable().optional(),
  capturedVideoId: z.number().nullable().optional(),
});

const gradeFields = {
  grade1AlertsBelow: z.number().min(0).max(100),
  grade1WarningsBelow: z.number().min(0).max(100),
  grade2AlertsBelow: z.number().min(0).max(100),
  grade2WarningsBelow: z.number().min(0).max(100),
  grade3AlertsBelow: z.number().min(0).max(100),
  grade3WarningsBelow: z.number().min(0).max(100),
  grade4AlertsBelow: z.number().min(0).max(100),
  grade4WarningsBelow: z.number().min(0).max(100),
};

export const dashboardEvaluationSchema = z.object({
  id: z.number(),
  dashboardConfigurationId: z.number(),
  ...gradeFields,
  createdAt: timestampsSchema.createdAt,
  updatedAt: timestampsSchema.updatedAt,
});

export const upsertDashboardEvaluationSchema = z.object({
  ...gradeFields,
});
