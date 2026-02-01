import { ModelStatusEnum } from "@repo/schema";
import { ProjectLabelEntity } from "../../project/entities/project-label.entity";
import { ModelSelect } from "../../../repository/types/model";
import { ModelResponse } from "../dto/model.dto";

export class ModelEntity {
  readonly id: number;
  readonly name: string;
  readonly projectId: number;
  readonly epochs: number;
  readonly status: ModelStatusEnum;
  readonly splitTrain: number;
  readonly splitValidate: number;
  readonly splitTest: number;
  readonly labels: ProjectLabelEntity[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;

  constructor(data: ModelSelect) {
    this.id = data.id;
    this.name = data.name;
    this.epochs = data.epochs;
    this.projectId = data.projectId;
    this.status = data.status;
    this.splitTrain = data.splitTrain;
    this.splitValidate = data.splitValidate;
    this.splitTest = data.splitTest;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.deletedAt = data.deletedAt;
    this.labels = data.labels.map((label) => new ProjectLabelEntity(label))
  }

  public toResponse(): ModelResponse {
    return {
      id: this.id,
      name: this.name,
      epochs: this.epochs,
      labels: this.labels.map((label) => label.toResponse()),
      status: this.status,
      splitTrain: this.splitTrain,
      splitValidate: this.splitValidate,
      splitTest: this.splitTest,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      deletedAt: this.deletedAt ? this.deletedAt.toISOString() : null,
    }
  }
}
