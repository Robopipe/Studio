import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ProjectId } from "../../auth/decorators/project-id.decorator";
import { ProjectGuard } from "../../auth/guards/project-guard";
import { ConfidenceReportService } from "../services/confidence-report.service";
import { RunConfidenceReportDto } from "../dto/confidence-report.dto";
import type { ConfidenceReportRegionResponse, RunConfidenceReport } from "@repo/schema";
import type { ConfidenceReportSelect } from "../../../repository/types/confidence-report";

@Controller("confidence-report/:projectId")
@UseGuards(ProjectGuard)
export class ConfidenceReportController {
  constructor(private readonly confidenceReportService: ConfidenceReportService) {}

  /** Get the current report (status + box-plot data). Returns 404 when none. */
  @Get()
  public async getReport(
    @ProjectId() projectId: number,
  ): Promise<ConfidenceReportSelect & { modelName: string | null }> {
    const report = await this.confidenceReportService.getReport(projectId);
    if (!report) {
      throw new NotFoundException("No confidence report found for this project");
    }
    return report;
  }

  /** Start a new report run (overwrites any existing report). */
  @Post()
  public async run(
    @ProjectId() projectId: number,
    @Body() body: RunConfidenceReportDto,
  ): Promise<ConfidenceReportSelect> {
    return this.confidenceReportService.run(projectId, body as RunConfidenceReport);
  }

  /** Cancel a running report. */
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  public async cancel(@ProjectId() projectId: number): Promise<void> {
    await this.confidenceReportService.cancel(projectId);
  }

  /** Get inferred regions for a specific task in the project's latest report. */
  @Get("regions/:taskId")
  public async getRegions(
    @ProjectId() projectId: number,
    @Param("taskId", ParseIntPipe) taskId: number,
  ): Promise<ConfidenceReportRegionResponse[]> {
    return this.confidenceReportService.getRegions(projectId, taskId);
  }
}
