import * as p from 'drizzle-orm/pg-core'
import { createdAt, id, updatedAt } from "../helpers";
import { dashboardConfigurationTable } from "./dashboard-configuration";

export const dashboardEvaluationTable = p.pgTable("dashboard_evaluation", {
  id,
  dashboardConfigurationId: p.integer("dashboard_configuration_id")
    .references(() => dashboardConfigurationTable.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  grade1AlertsBelow: p.doublePrecision("grade1_alerts_below").notNull(),
  grade1WarningsBelow: p.doublePrecision("grade1_warnings_below").notNull(),
  grade2AlertsBelow: p.doublePrecision("grade2_alerts_below").notNull(),
  grade2WarningsBelow: p.doublePrecision("grade2_warnings_below").notNull(),
  grade3AlertsBelow: p.doublePrecision("grade3_alerts_below").notNull(),
  grade3WarningsBelow: p.doublePrecision("grade3_warnings_below").notNull(),
  grade4AlertsBelow: p.doublePrecision("grade4_alerts_below").notNull(),
  grade4WarningsBelow: p.doublePrecision("grade4_warnings_below").notNull(),
  createdAt,
  updatedAt
})
