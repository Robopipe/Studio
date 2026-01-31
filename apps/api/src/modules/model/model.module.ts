import { Module } from "@nestjs/common";
import { ModelService } from "./services/model.service";
import { ModelController } from "./controllers/model.controller";

@Module({
  providers: [ModelService],
  controllers: [ModelController]
})
export class ModelModule {}
