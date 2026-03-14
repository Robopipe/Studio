import { defineRelationsPart } from "drizzle-orm";
import * as schema from '../entities'

export const relationEvalPart = defineRelationsPart(schema, (r) => ({
  evalTestCaseTable: {
    project: r.one.projectTable({
      from: r.evalTestCaseTable.projectId,
      to: r.projectTable.id
    }),
    limits: r.many.evalLimitTable(),
    thresholds: r.many.evalThresholdTable()
  },
  evalLimitTable: {
    testCase: r.one.evalTestCaseTable({
      from: r.evalLimitTable.testCaseId,
      to: r.evalTestCaseTable.id
    }),
    limitItems: r.many.evalLimitItemTable(),
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
    })
  }
}))
