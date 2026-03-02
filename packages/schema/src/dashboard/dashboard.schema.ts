import z from "zod";
import { labelSchema } from "../label";
import { timestampsSchema } from "../helpers";

export enum DashboardConfigurationItemTypeEnum {
  CHECK = 'CHECK',
  DEFECT = 'DEFECT',
}

export enum DashboardConfigurationItemSeverityEnum {
  ALERT = 'ALERT',
  WARNING = 'WARNING',
}


export enum DashboardConfigurationItemPositionEnum {
  POS_LEFT = 'POS_LEFT',
  POS_RIGHT = 'POS_RIGHT',
  POS_TOP = 'POS_TOP',
  POS_BOTTOM = 'POS_BOTTOM',
  POS_CENTER = 'POS_CENTER',
  AREA = 'AREA',
  COUNT = 'COUNT',
}

export enum DashboardConfigurationItemLimitUnitEnum {
  PERCENTAGE = 'PERCENTAGE',
  COUNT = 'COUNT',
}


const dashboardConfigurationItemBaseSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.enum(DashboardConfigurationItemTypeEnum),
  severity: z.enum(DashboardConfigurationItemSeverityEnum),
  position: z.enum(DashboardConfigurationItemPositionEnum),
  unit: z.enum(DashboardConfigurationItemLimitUnitEnum),
  targetLabel: labelSchema,
  targetParentLabel: labelSchema.nullable(),
  limitFrom: z.number().nullable(),
  limitTo: z.number().nullable(),
  createdAt: timestampsSchema.createdAt,
  updatedAt: timestampsSchema.updatedAt,
});

const limitRefinement = <T extends { limitFrom: number | null; limitTo: number | null }>(data: T) =>
  data.limitFrom !== null || data.limitTo !== null;

const limitRefinementMessage = { message: "At least one of limitFrom or limitTo must be provided", path: ["limitFrom"] };

export const dashboardConfigurationItemSchema = dashboardConfigurationItemBaseSchema.refine(
  limitRefinement,
  limitRefinementMessage,
);

export const createDashboardConfigurationItemSchema = dashboardConfigurationItemBaseSchema
  .pick({
    name: true,
    type: true,
    severity: true,
    position: true,
    unit: true,
    limitFrom: true,
    limitTo: true,
  })
  .extend({
    targetLabelId: z.number(),
    targetParentLabelId: z.number().nullable(),
  })
  .refine(limitRefinement, limitRefinementMessage);

export const updateDashboardConfigurationItemSchema = createDashboardConfigurationItemSchema;

export const dashboardConfigurationSchema = z.object({
  id: z.number(),
  name: z.string(),
  projectId: z.number(),
  createdAt: timestampsSchema.createdAt,
  updatedAt: timestampsSchema.updatedAt,
})

export const dashboardConfigurationWithItemsSchema = dashboardConfigurationSchema.extend({
  items: dashboardConfigurationItemSchema.array(),
})

export const createDashboardConfigurationSchema = z.object({
  name: z.string().min(1).max(256),
});

export const updateDashboardConfigurationSchema = createDashboardConfigurationSchema;

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
