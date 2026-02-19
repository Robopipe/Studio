import {
  DashboardConfigurationItemLimitUnitEnum,
  DashboardConfigurationItemPositionEnum,
  DashboardConfigurationItemSeverityEnum,
  DashboardConfigurationItemTypeEnum,
} from "@repo/schema";

export class DashboardConfigurationItemEntity {
  private readonly id: number;
  private readonly name: string;
  private readonly projectId: number;
  private readonly type: DashboardConfigurationItemTypeEnum;
  private readonly severity: DashboardConfigurationItemSeverityEnum;
  private readonly position: DashboardConfigurationItemPositionEnum;
  private readonly unit: DashboardConfigurationItemLimitUnitEnum;
  private readonly targetLabelId: number;
  private readonly targetParentLabelId: number;
  private readonly limitFrom: number;
  private readonly limitTo: number;
  private readonly createdAt: Date;
  private readonly updatedAt: Date;


  constructor(data: ) {
  }
}
