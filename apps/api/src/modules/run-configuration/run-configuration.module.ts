import { Module } from "@nestjs/common";
import { RunConfigurationController } from "./controllers/run-configuration.controller";
import { RunConfigurationService } from "./services/run-configuration.service";

@Module({
  providers: [RunConfigurationService],
  controllers: [RunConfigurationController]
})
export class RunConfigurationModule {}
