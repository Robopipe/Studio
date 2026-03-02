import * as p from 'drizzle-orm/pg-core'
import { createdAt, id, updatedAt } from "../helpers";
import { projectLabelTable } from "./project-label";
import { dashboardConfigurationTable } from "./dashboard-configuration";
import {
  DashboardConfigurationItemTypeEnum,
  DashboardConfigurationItemLimitUnitEnum,
  DashboardConfigurationItemPositionEnum, DashboardConfigurationItemSeverityEnum } from "@repo/schema";

export const dashboardConfigurationItemTypeEnum = p.pgEnum("dashboard_configuration_item_type_enum", [
  DashboardConfigurationItemTypeEnum.CHECK,
  DashboardConfigurationItemTypeEnum.DEFECT,
])

export const dashboardConfigurationItemSeverityEnum = p.pgEnum("dashboard_configuration_item_severity_enum", [
  DashboardConfigurationItemSeverityEnum.ALERT,
  DashboardConfigurationItemSeverityEnum.WARNING,
])

export const dashboardConfigurationItemPositionEnum = p.pgEnum("dashboard_configuration_item_position_enum", [
  DashboardConfigurationItemPositionEnum.POS_LEFT,
  DashboardConfigurationItemPositionEnum.POS_RIGHT,
  DashboardConfigurationItemPositionEnum.POS_TOP,
  DashboardConfigurationItemPositionEnum.POS_BOTTOM,
  DashboardConfigurationItemPositionEnum.POS_CENTER,
  DashboardConfigurationItemPositionEnum.AREA,
  DashboardConfigurationItemPositionEnum.COUNT,
])


export const dashboardConfigurationItemLimitUnitEnum = p.pgEnum("dashboard_configuration_item_limit_unit_enum", [
  DashboardConfigurationItemLimitUnitEnum.PERCENTAGE,
  DashboardConfigurationItemLimitUnitEnum.COUNT,
])

export const dashboardConfigurationItemTable = p.pgTable("dashboard_configuration_item", {
  id,
  dashboardConfigurationId: p.integer("dashboard_configuration_id").references(() => dashboardConfigurationTable.id, {onDelete: 'cascade'}).notNull(),
  name: p.varchar("name", {length: 256}).notNull(),
  type: dashboardConfigurationItemTypeEnum("type").notNull(),
  severity: dashboardConfigurationItemSeverityEnum("severity").notNull(),
  position: dashboardConfigurationItemPositionEnum("position").notNull(),
  unit: dashboardConfigurationItemLimitUnitEnum("unit").notNull(),
  targetLabelId: p.integer("target_label").references(() => projectLabelTable.id, {onDelete: 'cascade'}).notNull(),
  targetParentLabelId: p.integer("target_parent_label").references(() => projectLabelTable.id, {onDelete: 'cascade'}),
  limitFrom: p.doublePrecision("limit_from"),
  limitTo: p.doublePrecision("limit_to"),
  createdAt,
  updatedAt
})
