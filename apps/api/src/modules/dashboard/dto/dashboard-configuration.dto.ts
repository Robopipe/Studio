import { createZodDto } from "nestjs-zod";
import {
  createDashboardConfigurationSchema,
  dashboardConfigurationSchema,
  updateDashboardConfigurationSchema,
} from "@repo/schema";

export class DashboardConfigurationResponse extends createZodDto(dashboardConfigurationSchema) {}
export class DashboardConfigurationCreateRequest extends createZodDto(createDashboardConfigurationSchema) {}
export class DashboardConfigurationUpdateRequest extends createZodDto(updateDashboardConfigurationSchema) {}
