import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { AppConfig } from "../../core/configuration/app.config";
import { TrainingExternalService } from "./services/training-external.service";
import { TrainingExternalController } from "./controllers/training-external.controller";

@Module({
  imports: [HttpModule.registerAsync({
    inject: [AppConfig],
    useFactory: (config: AppConfig) => ({
      baseURL: config.mlHost,
      headers: {
        Authorization: config.mlSecret
      }
    })
  })],
  providers: [TrainingExternalService],
  controllers: [TrainingExternalController]
})
export class TrainingExternalModule {}
