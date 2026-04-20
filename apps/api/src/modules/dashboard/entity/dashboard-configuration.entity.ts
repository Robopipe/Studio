import { DashboardConfigurationZoneDirectionEnum } from "@repo/schema";
import {
  DashboardConfigurationSelect,
} from "../../../repository/types/dashboard-configuration";
import { DashboardConfigurationResponse } from "../dto/dashboard-configuration.dto";

export class DashboardConfigurationEntity {
  readonly id: number;
  readonly name: string;
  readonly projectId: number;
  readonly zoneDirection: DashboardConfigurationZoneDirectionEnum;
  readonly zoneCenter: number;
  readonly zoneThickness: number;
  readonly optimistic: boolean;
  readonly modelId: number | null;
  readonly cameraMxid: string | null;
  readonly streamName: string | null;
  readonly capturedVideoId: number | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(data: DashboardConfigurationSelect) {
    this.id = data.id;
    this.name = data.name;
    this.projectId = data.projectId;
    this.zoneDirection = data.zoneDirection;
    this.zoneCenter = data.zoneCenter;
    this.zoneThickness = data.zoneThickness;
    this.optimistic = data.optimistic;
    this.modelId = data.modelId;
    this.cameraMxid = data.cameraMxid;
    this.streamName = data.streamName;
    this.capturedVideoId = data.capturedVideoId;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  public toResponse(): DashboardConfigurationResponse {
    return {
      id: this.id,
      name: this.name,
      projectId: this.projectId,
      zoneDirection: this.zoneDirection,
      zoneCenter: this.zoneCenter,
      zoneThickness: this.zoneThickness,
      optimistic: this.optimistic,
      modelId: this.modelId,
      cameraMxid: this.cameraMxid,
      streamName: this.streamName,
      capturedVideoId: this.capturedVideoId,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
