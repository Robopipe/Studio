import { evalLimitItemTable, evalLimitTable, evalTestCaseTable, evalThresholdTable } from "@repo/database";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { ProjectLabelSelect } from "./project-label";

export type EvalLimitItemSelect = InferSelectModel<typeof evalLimitItemTable>
export type EvalLimitItemInsert = Omit<InferInsertModel<typeof evalLimitItemTable>, "id" | "createdAt" | "updatedAt">

// Eval limit
export type EvalLimitSelect = InferSelectModel<typeof evalLimitTable> & {
  targetLabel: ProjectLabelSelect;
  targetParentLabel: ProjectLabelSelect | null;
}
export type EvalLimitDetailSelect = EvalLimitSelect & {
  limitItems: EvalLimitItemSelect[]
}

export type EvalLimitInsert = Omit<InferInsertModel<typeof evalLimitTable>, "id" | "createdAt" | "updatedAt" | "testCaseId">

// Eval test case
export type EvalTestCaseThresholdSelect = Omit<InferSelectModel<typeof evalTestCaseTable>, "logicNodes" | "type" | "severity"> & {thresholds: EvalThresholdSelect[]}
export type EvalTestCaseSelect = Omit<InferSelectModel<typeof evalTestCaseTable>, "logicNodes"> & {
  limits: EvalLimitSelect[];
}
export type EvalTestCaseDetailSelect = EvalTestCaseSelect & Pick<InferSelectModel<typeof evalTestCaseTable>, "logicNodes">
export type EvalTestCaseInsert = Omit<InferInsertModel<typeof evalTestCaseTable>, "id" | "projectId" | "createdAt" | "updatedAt">


export type EvalThresholdSelect = InferSelectModel<typeof evalThresholdTable>
export type EvalThresholdInsert = Omit<InferInsertModel<typeof evalThresholdTable>, "id" | "testCaseId" | "createdAt" | "updatedAt">
