import { Module } from "@nestjs/common";
import { PreAnnotateSettingsController } from "./controllers/pre-annotate-settings.controller";
import { PreAnnotateSettingsService } from "./services/pre-annotate-settings.service";

@Module({
  controllers: [PreAnnotateSettingsController],
  providers: [PreAnnotateSettingsService],
})
export class PreAnnotateSettingsModule {}
