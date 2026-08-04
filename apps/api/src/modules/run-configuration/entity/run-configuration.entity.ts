import {
  RunConfigurationSelect,
} from "../../../repository/types/run-configuration";
import { RunConfigurationResponse } from "../dto/run-configuration.dto";

export class RunConfigurationEntity {
  readonly id: number;
  readonly projectId: number;
  readonly modelId: number | null;
  readonly streamName: string | null;
  readonly capturedVideoId: number | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(data: RunConfigurationSelect) {
    this.id = data.id;
    this.projectId = data.projectId;
    this.modelId = data.modelId;
    this.streamName = data.streamName;
    this.capturedVideoId = data.capturedVideoId;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  public toResponse(): RunConfigurationResponse {
    return {
      id: this.id,
      projectId: this.projectId,
      modelId: this.modelId,
      streamName: this.streamName,
      capturedVideoId: this.capturedVideoId,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
