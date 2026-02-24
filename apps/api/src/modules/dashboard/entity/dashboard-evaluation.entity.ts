import { DashboardEvaluationSelect } from "../../../repository/types/dashboard-evaluation";
import { DashboardEvaluationResponse } from "../dto/dashboard-evaluation.dto";

export class DashboardEvaluationEntity {
  readonly id: number;
  readonly dashboardConfigurationId: number;
  readonly grade1AlertsBelow: number;
  readonly grade1WarningsBelow: number;
  readonly grade2AlertsBelow: number;
  readonly grade2WarningsBelow: number;
  readonly grade3AlertsBelow: number;
  readonly grade3WarningsBelow: number;
  readonly grade4AlertsBelow: number;
  readonly grade4WarningsBelow: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(data: DashboardEvaluationSelect) {
    this.id = data.id;
    this.dashboardConfigurationId = data.dashboardConfigurationId;
    this.grade1AlertsBelow = data.grade1AlertsBelow;
    this.grade1WarningsBelow = data.grade1WarningsBelow;
    this.grade2AlertsBelow = data.grade2AlertsBelow;
    this.grade2WarningsBelow = data.grade2WarningsBelow;
    this.grade3AlertsBelow = data.grade3AlertsBelow;
    this.grade3WarningsBelow = data.grade3WarningsBelow;
    this.grade4AlertsBelow = data.grade4AlertsBelow;
    this.grade4WarningsBelow = data.grade4WarningsBelow;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  public toResponse(): DashboardEvaluationResponse {
    return {
      id: this.id,
      dashboardConfigurationId: this.dashboardConfigurationId,
      grade1AlertsBelow: this.grade1AlertsBelow,
      grade1WarningsBelow: this.grade1WarningsBelow,
      grade2AlertsBelow: this.grade2AlertsBelow,
      grade2WarningsBelow: this.grade2WarningsBelow,
      grade3AlertsBelow: this.grade3AlertsBelow,
      grade3WarningsBelow: this.grade3WarningsBelow,
      grade4AlertsBelow: this.grade4AlertsBelow,
      grade4WarningsBelow: this.grade4WarningsBelow,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
