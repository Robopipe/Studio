import {
  ModelAugmentationTypeEnum,
  ModelOutputTypeEnum,
  ModelStatusEnum,
  ProjectTypeEnum,
} from "@repo/schema";
import { ModelAugmentationSelect, ModelSelect } from "../../../repository/types/model";
import { ProjectLabelEntity } from "../../project/entities/project-label.entity";
import { ModelResponse } from "../dto/model.dto";

export class ModelEntity {
  readonly id: number;
  readonly name: string;
  readonly projectId: number;
  readonly epochs: number;
  readonly status: ModelStatusEnum;
  readonly outputTypes: ModelOutputTypeEnum[];
  readonly trainingType: ProjectTypeEnum;
  readonly annotationsUsed: ProjectTypeEnum[];
  readonly splitTrain: number;
  readonly splitValidate: number;
  readonly splitTest: number;
  readonly customHyperparams: Record<string, unknown>;
  readonly errorMessage: string | null;
  readonly labels: ProjectLabelEntity[];
  readonly augmentations: ModelAugmentationSelect[];
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
    this.errorMessage = data.errorMessage;
    this.labels = data.labels.map((label) => new ProjectLabelEntity(label));
    this.augmentations = data.augmentations;
  }

  public toResponse(): ModelResponse {
    return {
      id: this.id,
      name: this.name,
      epochs: this.epochs,
      labels: this.labels.map((label) => label.toResponse()),
      status: this.status,
      outputTypes: this.outputTypes,
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
      errorMessage: this.errorMessage,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      deletedAt: this.deletedAt ? this.deletedAt.toISOString() : null,
    };
  }
}
