import { Module } from "@nestjs/common";
import { DashboardConfigurationItemController } from "./controllers/dashboard-configuration-item.controller";
import { DashboardService } from "./services/dashboard.service";

@Module({
  providers: [DashboardService],
  controllers: [DashboardConfigurationItemController]
})
export class DashboardModule {}
