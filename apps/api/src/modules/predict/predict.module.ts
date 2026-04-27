import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { AssetsModule } from "../assets/assets.module";
import { PredictController } from "./controllers/predict.controller";
import { PredictService } from "./services/predict.service";

@Module({
  imports: [HttpModule.register({}), AssetsModule],
  controllers: [PredictController],
  providers: [PredictService],
})
export class PredictModule {}
