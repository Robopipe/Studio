import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { modelTable } from "@repo/database";
import { ProjectLabelSelect } from "./project-label";

export type ModelSelect = InferSelectModel<typeof modelTable> & {labels: ProjectLabelSelect[]}
export type ModelInsert = InferInsertModel<typeof modelTable>;
export type ModelUpdate = Partial<Pick<ModelInsert, "name" | "epochs" | "splitTest" | "splitValidate" | "splitTrain" | "status" | "outputTypes" | "trainingType" | "annotationsUsed" | "customHyperparams" | "errorMessage">>
