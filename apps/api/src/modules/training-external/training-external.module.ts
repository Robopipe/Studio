import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { AppConfig } from "../../core/configuration/app.config";
import { TrainingExternalService } from "./services/training-external.service";
import { TrainingExternalController } from "./controllers/training-external.controller";
import { AssetsModule } from "../assets/assets.module";

@Module({
  imports: [HttpModule.registerAsync({
    inject: [AppConfig],
    useFactory: (config: AppConfig) => ({
      baseURL: config.mlHostYolo ?? "",
      headers: {
        Authorization: config.mlSecret
      }
    })
  }), AssetsModule],
  providers: [
    TrainingExternalService,
  ],
  controllers: [TrainingExternalController],
  exports: [TrainingExternalService]
})
export class TrainingExternalModule {}
