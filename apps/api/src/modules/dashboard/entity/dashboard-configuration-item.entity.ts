import {
  DashboardConfigurationItemLimitUnitEnum,
  DashboardConfigurationItemPositionEnum,
  DashboardConfigurationItemSeverityEnum,
  DashboardConfigurationItemTypeEnum,
  LimitPair,
} from "@repo/schema";
import { DashboardConfigurationItemSelect } from "../../../repository/types/dashboard-configuration-item";
import { ProjectLabelEntity } from "../../project/entities/project-label.entity";
import { DashboardConfigurationItemResponse } from "../dto/dashboard-configuration-item.dto";

export class DashboardConfigurationItemEntity {
  readonly id: number;
  readonly name: string;
  readonly dashboardConfigurationId: number;
  readonly type: DashboardConfigurationItemTypeEnum;
  readonly severity: DashboardConfigurationItemSeverityEnum;
  readonly position: DashboardConfigurationItemPositionEnum;
  readonly unit: DashboardConfigurationItemLimitUnitEnum;
  readonly targetLabel: ProjectLabelEntity;
  readonly targetParentLabel: ProjectLabelEntity | null;
  readonly limits: LimitPair[];
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(data: DashboardConfigurationItemSelect) {
    this.id = data.id;
    this.name = data.name;
    this.dashboardConfigurationId = data.dashboardConfigurationId;
    this.type = data.type;
    this.severity = data.severity;
    this.position = data.position;
    this.unit = data.unit;
    this.targetLabel = new ProjectLabelEntity(data.targetLabel);
    this.targetParentLabel = data.targetParentLabel
      ? new ProjectLabelEntity(data.targetParentLabel)
      : null;
    this.limits = data.limits;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  public toResponse(): DashboardConfigurationItemResponse {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      severity: this.severity,
      position: this.position,
      unit: this.unit,
      targetLabel: this.targetLabel.toResponse(),
      targetParentLabel: this.targetParentLabel?.toResponse() ?? null,
      limits: this.limits,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
