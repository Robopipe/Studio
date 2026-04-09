import { defineRelationsPart } from "drizzle-orm";
import * as schema from '../entities'

export const relationEvalPart = defineRelationsPart(schema, (r) => ({
  evalTestCaseTable: {
    project: r.one.projectTable({
      from: r.evalTestCaseTable.projectId,
      to: r.projectTable.id
    }),
    dashboardConfiguration: r.one.dashboardConfigurationTable({
      from: r.evalTestCaseTable.dashboardConfigurationId,
      to: r.dashboardConfigurationTable.id
    }),
    limits: r.many.evalLimitTable({
      from: r.evalTestCaseTable.id,
      to: r.evalLimitTable.testCaseId,
    }),
    thresholds: r.many.evalThresholdTable({
      from: r.evalTestCaseTable.id,
      to: r.evalThresholdTable.testCaseId,
    })
  },
  evalLimitTable: {
    testCase: r.one.evalTestCaseTable({
      from: r.evalLimitTable.testCaseId,
      to: r.evalTestCaseTable.id
    }),
    limitItems: r.many.evalLimitItemTable({
      from: r.evalLimitTable.id,
      to: r.evalLimitItemTable.limitId,
    }),
    targetLabel: r.one.projectLabelTable({
      from: r.evalLimitTable.targetLabelId,
      to: r.projectLabelTable.id,
    }),
    targetParentLabel: r.one.projectLabelTable({
      from: r.evalLimitTable.targetParentLabelId,
      to: r.projectLabelTable.id,
    })
  },
  evalLimitItemTable: {
    limit: r.one.evalLimitTable({
      from: r.evalLimitItemTable.limitId,
      to: r.evalLimitTable.id
    }),
  },
  evalThresholdTable: {
    testCase: r.one.evalTestCaseTable({
      from: r.evalThresholdTable.testCaseId,
      to: r.evalTestCaseTable.id
    }),
    dashboardConfiguration: r.one.dashboardConfigurationTable({
      from: r.evalThresholdTable.dashboardConfigurationId,
      to: r.dashboardConfigurationTable.id
    })
  }
}))
