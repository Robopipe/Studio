import { Injectable, NotFoundException } from "@nestjs/common";
import { DashboardConfigurationItemRepository } from "../../../repository/services/dashboard-configuration-item.service";
import { DashboardConfigurationItemEntity } from "../entity/dashboard-configuration-item.entity";
import {
  DashboardConfigurationItemCreateRequest,
  DashboardConfigurationItemUpdateRequest,
} from "../dto/dashboard-configuration-item.dto";

@Injectable()
export class DashboardService {
  constructor(
    private readonly dashboardConfigurationItemRepository: DashboardConfigurationItemRepository,
  ) {}

  public async getAll(projectId: number): Promise<DashboardConfigurationItemEntity[]> {
    return this.dashboardConfigurationItemRepository.getAllByProjectId(projectId);
  }

  public async getById(id: number, projectId: number): Promise<DashboardConfigurationItemEntity> {
    const item = await this.dashboardConfigurationItemRepository.getByIdAndProjectId(id, projectId);

    if (!item) {
      throw new NotFoundException("Dashboard configuration item not found");
    }

    return item;
  }

  public async create(projectId: number, data: DashboardConfigurationItemCreateRequest): Promise<DashboardConfigurationItemEntity> {
    return this.dashboardConfigurationItemRepository.create({
      projectId,
      name: data.name,
      type: data.type,
      severity: data.severity,
      position: data.position,
      unit: data.unit,
      targetLabelId: data.targetLabelId,
      targetParentLabelId: data.targetParentLabelId,
      limitFrom: data.limitFrom,
      limitTo: data.limitTo,
    });
  }

  public async update(id: number, projectId: number, data: DashboardConfigurationItemUpdateRequest): Promise<DashboardConfigurationItemEntity> {
    await this.getById(id, projectId);

    return this.dashboardConfigurationItemRepository.update(id, {
      name: data.name,
      type: data.type,
      severity: data.severity,
      position: data.position,
      unit: data.unit,
      targetLabelId: data.targetLabelId,
      targetParentLabelId: data.targetParentLabelId,
      limitFrom: data.limitFrom,
      limitTo: data.limitTo,
    });
  }

  public async delete(id: number, projectId: number): Promise<void> {
    await this.getById(id, projectId);
    await this.dashboardConfigurationItemRepository.delete(id);
  }
}
