import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { AssetsModule } from "../assets/assets.module";
import { ConfidenceReportController } from "./controllers/confidence-report.controller";
import { ConfidenceReportWebhookController } from "./controllers/confidence-report-webhook.controller";
import { ConfidenceReportService } from "./services/confidence-report.service";

@Module({
  imports: [HttpModule.register({}), AssetsModule],
  controllers: [ConfidenceReportController, ConfidenceReportWebhookController],
  providers: [ConfidenceReportService],
})
export class ConfidenceReportModule {}
