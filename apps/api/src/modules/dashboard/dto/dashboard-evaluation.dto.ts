import { createZodDto } from "nestjs-zod";
import {
  dashboardEvaluationSchema,
  upsertDashboardEvaluationSchema,
} from "@repo/schema";

export class DashboardEvaluationResponse extends createZodDto(dashboardEvaluationSchema) {}
export class DashboardEvaluationUpsertRequest extends createZodDto(upsertDashboardEvaluationSchema) {}
