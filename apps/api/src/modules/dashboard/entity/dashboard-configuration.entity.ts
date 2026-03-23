import {
  DashboardConfigurationLineDirectionEnum,
  DashboardConfigurationLineFlowEnum,
} from "@repo/schema";
import {
  DashboardConfigurationSelect,
} from "../../../repository/types/dashboard-configuration";
import { DashboardConfigurationResponse } from "../dto/dashboard-configuration.dto";

export class DashboardConfigurationEntity {
  readonly id: number;
  readonly name: string;
  readonly projectId: number;
  readonly lineDirection: DashboardConfigurationLineDirectionEnum;
  readonly linePosition: number;
  readonly lineFlow: DashboardConfigurationLineFlowEnum;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(data: DashboardConfigurationSelect) {
    this.id = data.id;
    this.name = data.name;
    this.projectId = data.projectId;
    this.lineDirection = data.lineDirection;
    this.linePosition = data.linePosition;
    this.lineFlow = data.lineFlow;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  public toResponse(): DashboardConfigurationResponse {
    return {
      id: this.id,
      name: this.name,
      projectId: this.projectId,
      lineDirection: this.lineDirection,
      linePosition: this.linePosition,
      lineFlow: this.lineFlow,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
