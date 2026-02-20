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
  DashboardConfigurationItemCreateRequest,
  DashboardConfigurationItemResponse,
  DashboardConfigurationItemUpdateRequest,
} from "../dto/dashboard-configuration-item.dto";

@Controller("dashboard-config/:projectId")
@UseGuards(ProjectGuard)
export class DashboardConfigurationItemController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  public async getAll(@ProjectId() projectId: number): Promise<DashboardConfigurationItemResponse[]> {
    const items = await this.dashboardService.getAll(projectId);
    return items.map((item) => item.toResponse());
  }

  @Get(":id")
  public async getById(
    @ProjectId() projectId: number,
    @Param("id", ParseIntPipe) id: number,
  ): Promise<DashboardConfigurationItemResponse> {
    const item = await this.dashboardService.getById(id, projectId);
    return item.toResponse();
  }

  @Post()
  public async create(
    @ProjectId() projectId: number,
    @Body() data: DashboardConfigurationItemCreateRequest,
  ): Promise<DashboardConfigurationItemResponse> {
    const item = await this.dashboardService.create(projectId, data);
    return item.toResponse();
  }

  @Put(":id")
  public async update(
    @ProjectId() projectId: number,
    @Param("id", ParseIntPipe) id: number,
    @Body() data: DashboardConfigurationItemUpdateRequest,
  ): Promise<DashboardConfigurationItemResponse> {
    const item = await this.dashboardService.update(id, projectId, data);
    return item.toResponse();
  }

  @Delete(":id")
  public async delete(
    @ProjectId() projectId: number,
    @Param("id", ParseIntPipe) id: number,
  ): Promise<void> {
    await this.dashboardService.delete(id, projectId);
  }
}
