import {
  DashboardConfigurationSelect,
  DashboardConfigurationWithItemsSelect,
} from "../../../repository/types/dashboard-configuration";
import { DashboardConfigurationItemEntity } from "./dashboard-configuration-item.entity";
import { DashboardConfigurationResponse } from "../dto/dashboard-configuration.dto";

export class DashboardConfigurationEntity {
  readonly id: number;
  readonly name: string;
  readonly projectId: number;
  readonly items?: DashboardConfigurationItemEntity[];
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(data: DashboardConfigurationSelect | DashboardConfigurationWithItemsSelect) {
    this.id = data.id;
    this.name = data.name;
    this.projectId = data.projectId;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;

    if ('items' in data && data.items) {
      this.items = data.items.map((item) => new DashboardConfigurationItemEntity(item));
    }
  }

  public toResponse(): DashboardConfigurationResponse {
    return {
      id: this.id,
      name: this.name,
      projectId: this.projectId,
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
