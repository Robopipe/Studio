import {
  DashboardConfigurationLineDirectionEnum,
  DashboardConfigurationLineFlowEnum,
} from "@repo/schema";
import {
  DashboardConfigurationSelect,
  DashboardConfigurationWithItemsSelect,
} from "../../../repository/types/dashboard-configuration";
import { DashboardConfigurationResponse } from "../dto/dashboard-configuration.dto";
import { DashboardConfigurationItemEntity } from "./dashboard-configuration-item.entity";

export class DashboardConfigurationEntity {
  readonly id: number;
  readonly name: string;
  readonly projectId: number;
  readonly lineDirection: DashboardConfigurationLineDirectionEnum;
  readonly linePosition: number;
  readonly lineFlow: DashboardConfigurationLineFlowEnum;
  readonly items?: DashboardConfigurationItemEntity[];
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(
    data: DashboardConfigurationSelect | DashboardConfigurationWithItemsSelect,
  ) {
    this.id = data.id;
    this.name = data.name;
    this.projectId = data.projectId;
    this.lineDirection = data.lineDirection;
    this.linePosition = data.linePosition;
    this.lineFlow = data.lineFlow;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;

    if ("items" in data && data.items) {
      this.items = data.items.map(
        (item) => new DashboardConfigurationItemEntity(item),
      );
    }
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

  public toResponseWithItems() {
    return {
      ...this.toResponse(),
      items: this.items?.map((item) => item.toResponse()) ?? [],
    };
  }
}
