import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from "@nestjs/common";
import { ProjectGuard } from "../../auth/guards/project-guard";
import { DashboardService } from "../services/dashboard.service";
import {
  DashboardEvaluationResponse,
  DashboardEvaluationUpsertRequest,
} from "../dto/dashboard-evaluation.dto";

@Controller("dashboard-config/:projectId/configurations/:configId/evaluation")
@UseGuards(ProjectGuard)
export class DashboardEvaluationController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  public async get(
    @Param("configId", ParseIntPipe) configId: number,
  ): Promise<DashboardEvaluationResponse | null> {
    const evaluation = await this.dashboardService.getEvaluation(configId);
    return evaluation?.toResponse() ?? null;
  }

  @Put()
  public async upsert(
    @Param("configId", ParseIntPipe) configId: number,
    @Body() data: DashboardEvaluationUpsertRequest,
  ): Promise<DashboardEvaluationResponse> {
    const evaluation = await this.dashboardService.upsertEvaluation(configId, data);
    return evaluation.toResponse();
  }
}
