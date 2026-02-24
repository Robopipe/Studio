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

@Controller("dashboard-config/:projectId/configurations/:configId/items")
@UseGuards(ProjectGuard)
export class DashboardConfigurationItemController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  public async getAll(
    @Param("configId", ParseIntPipe) configId: number,
  ): Promise<DashboardConfigurationItemResponse[]> {
    const items = await this.dashboardService.getAllItems(configId);
    return items.map((item) => item.toResponse());
  }

  @Get(":id")
  public async getById(
    @Param("configId", ParseIntPipe) configId: number,
    @Param("id", ParseIntPipe) id: number,
  ): Promise<DashboardConfigurationItemResponse> {
    const item = await this.dashboardService.getItemById(id, configId);
    return item.toResponse();
  }

  @Post()
  public async create(
    @Param("configId", ParseIntPipe) configId: number,
    @Body() data: DashboardConfigurationItemCreateRequest,
  ): Promise<DashboardConfigurationItemResponse> {
    const item = await this.dashboardService.createItem(configId, data);
    return item.toResponse();
  }

  @Put(":id")
  public async update(
    @Param("configId", ParseIntPipe) configId: number,
    @Param("id", ParseIntPipe) id: number,
    @Body() data: DashboardConfigurationItemUpdateRequest,
  ): Promise<DashboardConfigurationItemResponse> {
    const item = await this.dashboardService.updateItem(id, configId, data);
    return item.toResponse();
  }

  @Delete(":id")
  public async delete(
    @Param("configId", ParseIntPipe) configId: number,
    @Param("id", ParseIntPipe) id: number,
  ): Promise<void> {
    await this.dashboardService.deleteItem(id, configId);
  }
}
