import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { AppConfig } from "../../core/configuration/app.config";
import { TrainingExternalService } from "./services/training-external.service";
import { TrainingExternalController } from "./controllers/training-external.controller";

@Module({
  imports: [HttpModule.registerAsync({
    inject: [AppConfig],
    useFactory: (config: AppConfig) => ({
      baseURL: config.ml.host,
      headers: {
        Authorization: config.ml.apiKey
      }
    })
  })],
  providers: [TrainingExternalService],
  controllers: [TrainingExternalController],
  exports: [TrainingExternalService]
})
export class TrainingExternalModule {}
