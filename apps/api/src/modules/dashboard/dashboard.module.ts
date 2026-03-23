import { Module } from "@nestjs/common";
import { DashboardConfigurationController } from "./controllers/dashboard-configuration.controller";
import { DashboardEvaluationController } from "./controllers/dashboard-evaluation.controller";
import { DashboardService } from "./services/dashboard.service";

@Module({
  providers: [DashboardService],
  controllers: [DashboardConfigurationController, DashboardEvaluationController]
})
export class DashboardModule {}
