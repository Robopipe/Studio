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


export const dashboardConfigurationItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.enum(DashboardConfigurationItemTypeEnum),
  severity: z.enum(DashboardConfigurationItemSeverityEnum),
  position: z.enum(DashboardConfigurationItemPositionEnum),
  unit: z.enum(DashboardConfigurationItemLimitUnitEnum),
  targetLabel: labelSchema,
  targetParentLabel: labelSchema,
  limitFrom: z.number(),
  limitTo: z.number(),
  createdAt: timestampsSchema.createdAt,
  updatedAt: timestampsSchema.updatedAt,
})
