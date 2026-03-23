import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { ProjectGuard } from "../../auth/guards/project-guard";
import { ProjectId } from "../../auth/decorators/project-id.decorator";
import { DashboardService } from "../services/dashboard.service";
import {
  DashboardConfigurationCreateRequest,
  DashboardConfigurationResponse,
  DashboardConfigurationUpdateRequest,
} from "../dto/dashboard-configuration.dto";

@Controller("dashboard-config/:projectId/configurations")
@UseGuards(ProjectGuard)
export class DashboardConfigurationController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  public async getAll(@ProjectId() projectId: number): Promise<DashboardConfigurationResponse[]> {
    const configs = await this.dashboardService.getAllConfigurations(projectId);
    return configs.map((config) => config.toResponse());
  }

  @Get(":configId")
  public async getById(
    @ProjectId() projectId: number,
    @Param("configId", ParseIntPipe) configId: number,
  ): Promise<DashboardConfigurationResponse> {
    const config = await this.dashboardService.getConfigurationById(configId, projectId);
    return config.toResponse();
  }

  @Post()
  public async create(
    @ProjectId() projectId: number,
    @Body() data: DashboardConfigurationCreateRequest,
  ): Promise<DashboardConfigurationResponse> {
    const config = await this.dashboardService.createConfiguration(projectId, data);
    return config.toResponse();
  }

  @Put(":configId")
  public async update(
    @ProjectId() projectId: number,
    @Param("configId", ParseIntPipe) configId: number,
    @Body() data: DashboardConfigurationUpdateRequest,
  ): Promise<DashboardConfigurationResponse> {
    const config = await this.dashboardService.updateConfiguration(configId, projectId, data);
    return config.toResponse();
  }

  @Delete(":configId")
  public async delete(
    @ProjectId() projectId: number,
    @Param("configId", ParseIntPipe) configId: number,
  ): Promise<void> {
    await this.dashboardService.deleteConfiguration(configId, projectId);
  }
}
