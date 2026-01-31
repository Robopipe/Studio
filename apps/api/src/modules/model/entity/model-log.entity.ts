import { ModelLogSelect } from "../../../repository/types/model-log";
import { ModelLogMetrics } from "@repo/schema";
import { ModelLogResponse } from "../dto/model-log.dto";

export class ModelLogEntity {
  readonly id: number;
  readonly epoch: number;
  readonly modelId: number;
  readonly metrics: ModelLogMetrics;
  readonly created: Date;

  constructor(data: ModelLogSelect) {
    this.id = data.id;
    this.epoch = data.epoch;
    this.modelId = data.modelId;
    this.metrics = data.metrics;
    this.created = data.createdAt;
  }

  public toResponse(): ModelLogResponse {
    return {
      id: this.id,
      epoch: this.epoch,
      metrics: this.metrics,
      createdAt: this.created.toISOString()
    }
  }
}
