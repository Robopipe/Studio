import { Module } from "@nestjs/common";
import { DashboardConfigurationController } from "./controllers/dashboard-configuration.controller";
import { DashboardConfigurationItemController } from "./controllers/dashboard-configuration-item.controller";
import { DashboardEvaluationController } from "./controllers/dashboard-evaluation.controller";
import { DashboardService } from "./services/dashboard.service";

@Module({
  providers: [DashboardService],
  controllers: [DashboardConfigurationController, DashboardConfigurationItemController, DashboardEvaluationController]
})
export class DashboardModule {}
