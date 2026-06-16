import {
  ModelAugmentationTypeEnum,
  ModelBackendEnum,
  ModelOutputTypeEnum,
  ModelQuantizationEnum,
  ModelRegionEnum,
  ModelStatusEnum,
  ProjectTypeEnum,
} from "@repo/schema";
import { ModelAugmentationSelect, ModelPreprocessingSelect, ModelSelect } from "../../../repository/types/model";
import { ProjectLabelEntity } from "../../project/entities/project-label.entity";
import { ModelResponse } from "../dto/model.dto";

export class ModelEntity {
  readonly id: number;
  readonly name: string;
  readonly projectId: number;
  readonly epochs: number;
  readonly status: ModelStatusEnum;
  readonly outputTypes: ModelOutputTypeEnum[];
  readonly backend: ModelBackendEnum;
  readonly region: ModelRegionEnum;
  readonly quantization: ModelQuantizationEnum;
  readonly trainingType: ProjectTypeEnum;
  readonly annotationsUsed: ProjectTypeEnum[];
  readonly splitTrain: number;
  readonly splitValidate: number;
  readonly splitTest: number;
  readonly customHyperparams: Record<string, unknown>;
  readonly batchJobName: string | null;
  readonly errorMessage: string | null;
  readonly finalAccuracy: number | null;
  readonly finalLoss: number | null;
  readonly bestMap50: number | null;
  readonly labels: ProjectLabelEntity[];
  readonly taskIds: number[];
  readonly datasetVersionId: number | null;
  readonly useGroups: boolean;
  readonly augmentations: ModelAugmentationSelect[];
  readonly preprocessings: ModelPreprocessingSelect[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;

  constructor(data: ModelSelect) {
    this.id = data.id;
    this.name = data.name;
    this.epochs = data.epochs;
    this.projectId = data.projectId;
    this.status = data.status;
    this.outputTypes = data.outputTypes;
    this.backend = data.backend;
    this.region = data.region;
    this.quantization = data.quantization;
    this.trainingType = data.trainingType;
    this.annotationsUsed = data.annotationsUsed;
    this.splitTrain = data.splitTrain;
    this.splitValidate = data.splitValidate;
    this.splitTest = data.splitTest;
    this.customHyperparams = (data.customHyperparams ?? {}) as Record<
      string,
      unknown
    >;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.deletedAt = data.deletedAt;
    this.batchJobName = data.batchJobName;
    this.errorMessage = data.errorMessage;
    this.finalAccuracy = data.finalAccuracy;
    this.finalLoss = data.finalLoss;
    this.bestMap50 = data.bestMap50;
    this.labels = data.labels.map((label) => new ProjectLabelEntity(label));
    this.taskIds = data.taskIds ?? [];
    this.datasetVersionId = data.datasetVersionId ?? null;
    this.useGroups = data.useGroups;
    this.augmentations = data.augmentations;
    this.preprocessings = data.preprocessings;
  }

  public toResponse(): ModelResponse {
    return {
      id: this.id,
      name: this.name,
      epochs: this.epochs,
      labels: this.labels.map((label) => label.toResponse()),
      taskIds: this.taskIds,
      datasetVersionId: this.datasetVersionId,
      status: this.status,
      outputTypes: this.outputTypes,
      backend: this.backend,
      region: this.region,
      quantization: this.quantization,
      trainingType: this.trainingType,
      annotationsUsed: this.annotationsUsed,
      splitTrain: this.splitTrain,
      splitValidate: this.splitValidate,
      splitTest: this.splitTest,
      customHyperparams: this.customHyperparams,
      augmentations: this.augmentations.map((aug) => ({
        type: aug.type as ModelAugmentationTypeEnum,
        params: (aug.params ?? {}) as Record<string, unknown>,
      })),
      preprocessings: this.preprocessings.map((pp) => ({
        type: pp.type as ModelAugmentationTypeEnum,
        params: (pp.params ?? {}) as Record<string, unknown>,
        keepOriginal: pp.keepOriginal,
      })),
      useGroups: this.useGroups,
      errorMessage: this.errorMessage,
      finalAccuracy: this.finalAccuracy,
      finalLoss: this.finalLoss,
      bestMap50: this.bestMap50,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      deletedAt: this.deletedAt ? this.deletedAt.toISOString() : null,
    };
  }
}
