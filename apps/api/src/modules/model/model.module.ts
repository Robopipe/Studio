import { Module } from "@nestjs/common";
import { TrainingExternalModule } from "../training-external/training-external.module";
import { ModelController } from "./controllers/model.controller";
import { ModelService } from "./services/model.service";

@Module({
  imports: [TrainingExternalModule],
  providers: [ModelService],
  controllers: [ModelController],
})
export class ModelModule {}
