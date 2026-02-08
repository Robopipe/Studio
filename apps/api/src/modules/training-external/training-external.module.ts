import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { JobsClient } from "@google-cloud/run";
import { AppConfig } from "../../core/configuration/app.config";
import { TrainingExternalService } from "./services/training-external.service";
import { TrainingExternalController } from "./controllers/training-external.controller";
import { AssetsModule } from "../assets/assets.module";

export const CLOUD_RUN_JOBS_CLIENT = "CLOUD_RUN_JOBS_CLIENT";

@Module({
  imports: [HttpModule.registerAsync({
    inject: [AppConfig],
    useFactory: (config: AppConfig) => ({
      baseURL: config.mlHost ?? "",
      headers: {
        Authorization: config.mlSecret
      }
    })
  }), AssetsModule],
  providers: [
    TrainingExternalService,
    {
      provide: CLOUD_RUN_JOBS_CLIENT,
      useValue: new JobsClient(),
    },
  ],
  controllers: [TrainingExternalController],
  exports: [TrainingExternalService]
})
export class TrainingExternalModule {}
