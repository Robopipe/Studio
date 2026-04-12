import { Module } from "@nestjs/common";
import { AssetsModule } from "../assets/assets.module";
import { CapturedVideoService } from "./services/captured-video.service";
import { CapturedVideoController } from "./controllers/captured-video.controller";

@Module({
  imports: [AssetsModule],
  providers: [CapturedVideoService],
  controllers: [CapturedVideoController],
})
export class CapturedVideoModule {}
