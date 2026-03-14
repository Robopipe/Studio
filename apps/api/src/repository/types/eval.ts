import { evalLimitItemTable, evalLimitTable, evalTestCaseTable } from "@repo/database";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { ProjectLabelSelect } from "./project-label";

export type EvalLimitItemSelect = InferSelectModel<typeof evalLimitItemTable>
export type EvalLimitItemInsert = Omit<InferInsertModel<typeof evalLimitItemTable>, "createdAt" | "updatedAt">

// Eval limit
export type EvalLimitSelect = InferSelectModel<typeof evalLimitTable> & {
  targetLabel: ProjectLabelSelect;
  targetParentLabel: ProjectLabelSelect | null;
}
export type EvalLimitDetailSelect = EvalLimitSelect & {
  limitItems: EvalLimitItemSelect[]
}

export type EvalLimitInsert = Omit<InferInsertModel<typeof evalLimitTable>, "createdAt" | "updatedAt" | "testCaseId">

// Eval test case
export type EvalTestCaseSelect = Omit<InferSelectModel<typeof evalTestCaseTable>, "logicNodes"> & {
  limits: EvalLimitSelect[];
}
export type EvalTestCaseDetailSelect = EvalTestCaseSelect & Pick<InferSelectModel<typeof evalTestCaseTable>, "logicNodes">
export type EvalTestCaseInsert = Omit<InferInsertModel<typeof evalTestCaseTable>, "projectId" | "createdAt" | "updatedAt">
