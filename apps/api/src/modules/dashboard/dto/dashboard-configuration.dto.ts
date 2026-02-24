import { createZodDto } from "nestjs-zod";
import {
  createDashboardConfigurationSchema,
  dashboardConfigurationSchema,
  dashboardConfigurationWithItemsSchema,
  updateDashboardConfigurationSchema,
} from "@repo/schema";

export class DashboardConfigurationResponse extends createZodDto(dashboardConfigurationSchema) {}
export class DashboardConfigurationWithItemsResponse extends createZodDto(dashboardConfigurationWithItemsSchema) {}
export class DashboardConfigurationCreateRequest extends createZodDto(createDashboardConfigurationSchema) {}
export class DashboardConfigurationUpdateRequest extends createZodDto(updateDashboardConfigurationSchema) {}
