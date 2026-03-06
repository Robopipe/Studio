import z from "zod";
import { timestampsSchema } from "../helpers";
import { labelSchema } from "../label";

export enum DashboardConfigurationItemTypeEnum {
  CHECK = "CHECK",
  DEFECT = "DEFECT",
}

export enum DashboardConfigurationItemSeverityEnum {
  ALERT = "ALERT",
  WARNING = "WARNING",
}

export enum DashboardConfigurationItemPositionEnum {
  POS_LEFT = "POS_LEFT",
  POS_RIGHT = "POS_RIGHT",
  POS_TOP = "POS_TOP",
  POS_BOTTOM = "POS_BOTTOM",
  POS_CENTER = "POS_CENTER",
  AREA = "AREA",
  COUNT = "COUNT",
}

export enum DashboardConfigurationItemLimitUnitEnum {
  PERCENTAGE = "PERCENTAGE",
  COUNT = "COUNT",
}

export const limitPairSchema = z
  .object({
    from: z.number().nullable(),
    to: z.number().nullable(),
  })
  .refine((pair) => pair.from !== null || pair.to !== null, {
    message: "At least one of from or to must be provided",
  });

const dashboardConfigurationItemBaseSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.enum(DashboardConfigurationItemTypeEnum),
  severity: z.enum(DashboardConfigurationItemSeverityEnum),
  position: z.enum(DashboardConfigurationItemPositionEnum),
  unit: z.enum(DashboardConfigurationItemLimitUnitEnum),
  targetLabel: labelSchema,
  targetParentLabel: labelSchema.nullable(),
  limits: z.array(limitPairSchema).min(1),
  createdAt: timestampsSchema.createdAt,
  updatedAt: timestampsSchema.updatedAt,
});

export const dashboardConfigurationItemSchema =
  dashboardConfigurationItemBaseSchema;

export const createDashboardConfigurationItemSchema =
  dashboardConfigurationItemBaseSchema
    .pick({
      name: true,
      type: true,
      severity: true,
      position: true,
      unit: true,
      limits: true,
    })
    .extend({
      targetLabelId: z.number(),
      targetParentLabelId: z.number().nullable(),
    });

export const updateDashboardConfigurationItemSchema =
  createDashboardConfigurationItemSchema;

export const dashboardConfigurationSchema = z.object({
  id: z.number(),
  name: z.string(),
  projectId: z.number(),
  createdAt: timestampsSchema.createdAt,
  updatedAt: timestampsSchema.updatedAt,
});

export const dashboardConfigurationWithItemsSchema =
  dashboardConfigurationSchema.extend({
    items: dashboardConfigurationItemSchema.array(),
  });

export const createDashboardConfigurationSchema = z.object({
  name: z.string().min(1).max(256),
});

export const updateDashboardConfigurationSchema =
  createDashboardConfigurationSchema;

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
