import { EvalThreshold } from "@repo/schema";
import { EvalThresholdSelect } from "src/repository/types/eval";

export class EvalThresholdEntity {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly value: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(data: EvalThresholdSelect){
    this.id = data.id;
    this.name = data.name;
    this.color = data.color;
    this.value = data.value;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  public toResponse(): EvalThreshold {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      value: this.value,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    }
  }
}
