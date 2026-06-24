import { createZodDto } from "nestjs-zod";
import { analyticsDatasetStatsQuerySchema, analyticsDatasetStatsSchema } from "@repo/schema";

export class AnalyticsDatasetStatsQuery extends createZodDto(analyticsDatasetStatsQuerySchema) {}
export class AnalyticsDatasetStatsResponse extends createZodDto(analyticsDatasetStatsSchema) {}
