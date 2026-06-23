import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { modelAugmentationTable, modelPreprocessingTable, modelTable } from "@repo/database";
import { ProjectLabelSelect } from "./project-label";
import { ModelOutputSelect } from "./model-output";

export type ModelAugmentationSelect = InferSelectModel<typeof modelAugmentationTable>;
export type ModelPreprocessingSelect = InferSelectModel<typeof modelPreprocessingTable>;
export type ModelSelect = InferSelectModel<typeof modelTable> & {labels: ProjectLabelSelect[], augmentations: ModelAugmentationSelect[], preprocessings: ModelPreprocessingSelect[], outputs: ModelOutputSelect[], taskIds: number[]}
export type ModelInsert = InferInsertModel<typeof modelTable>;
export type ModelUpdate = Partial<Pick<ModelInsert, "name" | "epochs" | "splitTest" | "splitValidate" | "splitTrain" | "status" | "outputTypes" | "backend" | "region" | "quantization" | "trainingType" | "annotationsUsed" | "customHyperparams" | "errorMessage" | "finalAccuracy" | "finalLoss" | "bestMap50" | "datasetVersionId" | "batchJobName" | "useGroups">>
