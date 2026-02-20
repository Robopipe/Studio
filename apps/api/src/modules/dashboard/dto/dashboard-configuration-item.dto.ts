import { createZodDto } from "nestjs-zod";
import {
  createDashboardConfigurationItemSchema,
  dashboardConfigurationItemSchema,
  updateDashboardConfigurationItemSchema,
} from "@repo/schema";

export class DashboardConfigurationItemResponse extends createZodDto(dashboardConfigurationItemSchema) {}
export class DashboardConfigurationItemCreateRequest extends createZodDto(createDashboardConfigurationItemSchema) {}
export class DashboardConfigurationItemUpdateRequest extends createZodDto(updateDashboardConfigurationItemSchema) {}
