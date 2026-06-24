import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ProjectId } from "../../auth/decorators/project-id.decorator";
import { ProjectGuard } from "../../auth/guards/project-guard";
import { AnalyticsDatasetStatsQuery, AnalyticsDatasetStatsResponse } from "../dto/analytics.dto";
import { AnalyticsService } from "../services/analytics.service";

@Controller("analytics/:projectId")
@UseGuards(ProjectGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("dataset-stats")
  public async getDatasetStats(
    @ProjectId() projectId: number,
    @Query() query: AnalyticsDatasetStatsQuery,
  ): Promise<AnalyticsDatasetStatsResponse> {
    return this.analyticsService.getDatasetStats(projectId, query.types);
  }
}
