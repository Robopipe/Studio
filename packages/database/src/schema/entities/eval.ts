import * as p from 'drizzle-orm/pg-core'
import { createdAt, updatedAt, uuidId } from '../helpers'
import { EvalLimitItemOperatorEnum, EvalLimitItemParameterEnum, EvalLimitItemQuantifierTypeEnum, EvalLimitItemQuantifierUnitEnum, EvalLogicNode, EvalSeverityEnum, EvalTestCaseTypeEnum } from '@repo/schema'
import { dashboardConfigurationTable } from './dashboard-configuration'
import { projectLabelTable } from './project-label'
import { projectTable } from './project'


export const evalLimitItemParameterEnum = p.pgEnum("eval_limit_item_parameter_enum", [
  EvalLimitItemParameterEnum.AREA,
  EvalLimitItemParameterEnum.COUNT,
  EvalLimitItemParameterEnum.POS_BOTTOM,
  EvalLimitItemParameterEnum.POS_CENTER,
  EvalLimitItemParameterEnum.POS_LEFT,
  EvalLimitItemParameterEnum.POS_RIGHT,
  EvalLimitItemParameterEnum.POS_TOP,
])

export const evalLimitItemOperatorEnum = p.pgEnum("eval_limit_item_operator_enum", [
  EvalLimitItemOperatorEnum.AND,
  EvalLimitItemOperatorEnum.OR,
])

export const evalLimitItemQuantifierTypeEnum = p.pgEnum("eval_limit_item_quantifier_type_enum", [
  EvalLimitItemQuantifierTypeEnum.EXACT,
  EvalLimitItemQuantifierTypeEnum.MAX,
  EvalLimitItemQuantifierTypeEnum.MIN,
])

export const evalLimitItemQuantifierUnitEnum = p.pgEnum("eval_limit_item_quantifier_unit_enum", [
  EvalLimitItemQuantifierUnitEnum.PCS,
  EvalLimitItemQuantifierUnitEnum.PERCENT,
])

export const evalTestCaseTypeEnum = p.pgEnum("eval_test_case_type_enum", [
  EvalTestCaseTypeEnum.CHECK,
  EvalTestCaseTypeEnum.DEFECT,
])

export const evalSeverityEnum = p.pgEnum("eval_severity_enum", [
  EvalSeverityEnum.ALERT,
  EvalSeverityEnum.WARNING,
])

export const evalLimitItemTable = p.pgTable("eval_limit_item", {
  id: uuidId,
  limitFrom: p.doublePrecision("limit_from"),
  limitTo: p.doublePrecision("limit_to"),
  position: p.integer("position").notNull(),
  parameter: evalLimitItemParameterEnum("parameter").notNull(),
  operator: evalLimitItemOperatorEnum("operator").notNull(),
  quantifierType: evalLimitItemQuantifierTypeEnum("quantifier_type").notNull(),
  quantifierUnit: evalLimitItemQuantifierUnitEnum("quantifier_unit").notNull(),
  quantifierValue: p.doublePrecision("quantifier_value").notNull(),
  limitId: p.varchar("limit_id", {length: 128}).notNull().references(() => evalLimitTable.id, {onDelete: 'cascade'}),
  createdAt,
  updatedAt
})


export const evalLimitTable = p.pgTable("eval_limit", {
  id: uuidId,
  name: p.varchar("name", { length: 255 }).notNull(),
  targetLabelId: p.integer("target_label_id").notNull().references(() => projectLabelTable.id, {onDelete: 'cascade'}),
  targetParentLabelId: p.integer("target_parent_label_id").references(() => projectLabelTable.id, {onDelete: 'cascade'}),
  severity: evalSeverityEnum("severity"),
  testCaseId: p.varchar("test_case_id", {length: 128}).notNull().references(() => evalTestCaseTable.id, {onDelete: 'cascade'}),
  createdAt,
  updatedAt
})


export const evalTestCaseTable = p.pgTable("eval_test_case", {
  id: uuidId,
  name: p.varchar("name", {length: 255}).notNull(),
  type: evalTestCaseTypeEnum("type").notNull(),
  severity: evalSeverityEnum("severity"),
  logicNodes: p.jsonb("logic_nodes").$type<EvalLogicNode[]>().notNull(),
  projectId: p.integer("project_id").notNull().references(() => projectTable.id, {onDelete: 'cascade'}),
  dashboardConfigurationId: p.integer("dashboard_configuration_id").notNull().references(() => dashboardConfigurationTable.id, {onDelete: 'cascade'}),
  createdAt,
  updatedAt
})


export const evalThresholdTable = p.pgTable("eval_threshold", {
  id: uuidId,
  name: p.varchar("name", {length: 255}).notNull(),
  value: p.doublePrecision("value").notNull(),
  color: p.varchar("color", {length: 255}).notNull(),
  testCaseId: p.varchar("test_case_id", {length: 128}).notNull().references(() => evalTestCaseTable.id, {onDelete: 'cascade'}),
  createdAt,
  updatedAt
})
