import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import { Public } from "../../auth/decorators/public.decorator";
import { ApiKeyGuard, ApiKeyType } from "../../auth/guards/api-key.guard";
import { ConfidenceReportService } from "../services/confidence-report.service";
import {
  ConfidenceReportCompleteDto,
  ConfidenceReportErrorDto,
  ConfidenceReportProgressDto,
} from "../dto/confidence-report.dto";
import type {
  ConfidenceReportComplete,
  ConfidenceReportError,
  ConfidenceReportProgress,
} from "@repo/schema";

@Controller("confidence-report/webhook")
@Public()
@UseGuards(ApiKeyGuard(ApiKeyType.TRAINING_EXTERNAL))
export class ConfidenceReportWebhookController {
  constructor(private readonly confidenceReportService: ConfidenceReportService) {}

  /** Periodic progress — sent every N tasks. */
  @Post("progress/:reportId")
  public async progress(
    @Param("reportId", ParseIntPipe) reportId: number,
    @Body() data: ConfidenceReportProgressDto,
  ): Promise<void> {
    await this.confidenceReportService.handleProgress(reportId, data as ConfidenceReportProgress);
  }

  /** Final completion — sent once when all tasks are processed. */
  @Post("complete/:reportId")
  public async complete(
    @Param("reportId", ParseIntPipe) reportId: number,
    @Body() data: ConfidenceReportCompleteDto,
  ): Promise<void> {
    await this.confidenceReportService.handleComplete(reportId, data as ConfidenceReportComplete);
  }

  /** Error — sent if the job fails. */
  @Post("error/:reportId")
  public async error(
    @Param("reportId", ParseIntPipe) reportId: number,
    @Body() data: ConfidenceReportErrorDto,
  ): Promise<void> {
    await this.confidenceReportService.handleError(reportId, data as ConfidenceReportError);
  }
}
