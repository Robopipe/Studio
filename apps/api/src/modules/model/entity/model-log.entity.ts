import { ModelLogSelect } from "../../../repository/types/model-log";
import {
  ModelLogConfusionMatrix,
  ModelLogMetrics,
  ModelLogPerClassMetrics,
} from "@repo/schema";
import { ModelLogResponse } from "../dto/model-log.dto";

export class ModelLogEntity {
  readonly id: number;
  readonly epoch: number;
  readonly modelId: number;
  readonly metrics: ModelLogMetrics;
  readonly perClassMetrics: ModelLogPerClassMetrics | null;
  readonly confusionMatrix: ModelLogConfusionMatrix | null;
  readonly created: Date;

  constructor(data: ModelLogSelect) {
    this.id = data.id;
    this.epoch = data.epoch;
    this.modelId = data.modelId;
    this.metrics = data.metrics;
    this.perClassMetrics = data.perClassMetrics ?? null;
    this.confusionMatrix = data.confusionMatrix ?? null;
    this.created = data.createdAt;
  }

  public toResponse(): ModelLogResponse {
    return {
      id: this.id,
      epoch: this.epoch,
      metrics: this.metrics,
      perClassMetrics: this.perClassMetrics,
      confusionMatrix: this.confusionMatrix,
      createdAt: this.created.toISOString()
    }
  }
}
