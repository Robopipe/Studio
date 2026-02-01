import { Module } from "@nestjs/common";
import { ModelService } from "./services/model.service";
import { ModelController } from "./controllers/model.controller";
import { TrainingExternalService } from "../training-external/services/training-external.service";

@Module({
  imports: [TrainingExternalService],
  providers: [ModelService],
  controllers: [ModelController]
})
export class ModelModule {}
