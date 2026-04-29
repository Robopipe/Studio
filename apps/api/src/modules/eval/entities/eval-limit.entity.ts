import { EvalLimitDetailSelect, EvalLimitSelect } from "src/repository/types/eval";
import { EvalLimitItemEntity } from "./eval-limit-item.entity";
import { ProjectLabelEntity } from "src/modules/project/entities/project-label.entity";
import { EvalLimit, EvalLimitDetail, EvalSeverityEnum } from "@repo/schema";

export class EvalLimitEntity {
  readonly id: string;
  readonly name: string;
  readonly targetLabelId: number;
  readonly targetParentLabelId: number | null;
  readonly severity: EvalSeverityEnum | null;
  readonly enabled: boolean;
  readonly targetLabel: ProjectLabelEntity;
  readonly targetParentLabel: ProjectLabelEntity | null;
  readonly testCaseId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(
    data: EvalLimitSelect
  ){
    this.id = data.id;
    this.name = data.name;
    this.targetLabelId = data.targetLabelId;
    this.targetParentLabelId = data.targetParentLabelId;
    this.severity = data.severity ?? null;
    this.enabled = data.enabled;
    this.targetLabel = new ProjectLabelEntity(data.targetLabel)
    this.targetParentLabel = data.targetParentLabel ? new ProjectLabelEntity(data.targetParentLabel) : null;
    this.testCaseId = data.testCaseId;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt
  }

  public toResponse(): EvalLimit {
    return {
      id: this.id,
      name: this.name,
      severity: this.severity,
      enabled: this.enabled,
      targetLabel: this.targetLabel.toResponse(),
      targetParentLabel: this.targetParentLabel ? this.targetParentLabel.toResponse() : null,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    }
  }
}



export class EvalLimitDetailEntity extends EvalLimitEntity {
  readonly limitItems: EvalLimitItemEntity[]

  constructor(data: EvalLimitDetailSelect){
    super(data)
    this.limitItems = data.limitItems.map((limitItem) => new EvalLimitItemEntity(limitItem))
  }

  public toDetailResponse(): EvalLimitDetail {
    return {
      ...this.toResponse(),
      limitItems: this.limitItems.map((limitItem) => limitItem.toResponse())
    }
  }
}
