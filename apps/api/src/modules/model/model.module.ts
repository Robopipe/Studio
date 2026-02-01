import { Module } from "@nestjs/common";
import { ModelService } from "./services/model.service";
import { ModelController } from "./controllers/model.controller";
import { TrainingExternalModule } from "../training-external/training-external.module";

@Module({
  imports: [TrainingExternalModule],
  providers: [ModelService],
  controllers: [ModelController]
})
export class ModelModule {}
