import { Injectable } from "@nestjs/common";
import type { AnalyticsDatasetStats, AnnotationType } from "@repo/schema";
import { AnalyticsRepository } from "src/repository/services/analytics-repository.service";

@Injectable()
export class AnalyticsService {
  constructor(private readonly analyticsRepository: AnalyticsRepository) {}

  public async getDatasetStats(
    projectId: number,
    types: AnnotationType[],
  ): Promise<AnalyticsDatasetStats> {
    const { labels, presence } = await this.analyticsRepository.getDatasetStats(projectId, types);

    return {
      availableTypes: {
        rectangle: presence.hasRectangle,
        polygon: presence.hasPolygon,
        classification: presence.hasClassification,
      },
      labels: labels.map((l) => ({
        labelId: l.labelId,
        name: l.name,
        color: l.color,
        instanceCount: l.instanceCount,
        area:
          l.q3 != null
            ? {
                min: l.minArea!,
                q1: l.q1!,
                median: l.median!,
                q3: l.q3,
                max: l.maxArea!,
                whiskerLow: l.whiskerLow!,
                whiskerHigh: l.whiskerHigh!,
                outliers: l.outliers,
                outlierCount: l.outlierCount,
              }
            : null,
      })),
    };
  }
}
