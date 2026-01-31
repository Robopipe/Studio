import { ModelOutputSelect } from "../../../repository/types/model-output";
import { ModelOutputTypeEnum, TaskFileTypeEnum } from "@repo/schema";
import { ModelOutputResponse } from "../dto/model-output.dto";

export class ModelOutputEntity {
  readonly id: number;
  readonly type: ModelOutputTypeEnum;
  readonly fileType: TaskFileTypeEnum;
  readonly filePath: string;
  readonly modelId: number;

  constructor(data: ModelOutputSelect) {
    this.id = data.id;
    this.type = data.type;
    this.fileType = data.fileType;
    this.filePath = data.filePath;
    this.modelId = data.modelId
  }

  public toResponse(): ModelOutputResponse {
    return {
      id: this.id,
      type: this.type,
      filePath: this.filePath,
      fileType: this.fileType
    }
  }
}
