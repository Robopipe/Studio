import { Injectable, NotFoundException } from "@nestjs/common";
import { DashboardConfigurationItemRepository } from "../../../repository/services/dashboard-configuration-item.service";
import { DashboardConfigurationRepository } from "../../../repository/services/dashboard-configuration.service";
import { DashboardEvaluationRepository } from "../../../repository/services/dashboard-evaluation.service";
import { DashboardConfigurationEntity } from "../entity/dashboard-configuration.entity";
import { DashboardConfigurationItemEntity } from "../entity/dashboard-configuration-item.entity";
import { DashboardEvaluationEntity } from "../entity/dashboard-evaluation.entity";
import {
  DashboardConfigurationCreateRequest,
  DashboardConfigurationUpdateRequest,
} from "../dto/dashboard-configuration.dto";
import {
  DashboardConfigurationItemCreateRequest,
  DashboardConfigurationItemUpdateRequest,
} from "../dto/dashboard-configuration-item.dto";
import { DashboardEvaluationUpsertRequest } from "../dto/dashboard-evaluation.dto";

@Injectable()
export class DashboardService {
  constructor(
    private readonly dashboardConfigurationRepository: DashboardConfigurationRepository,
    private readonly dashboardConfigurationItemRepository: DashboardConfigurationItemRepository,
    private readonly dashboardEvaluationRepository: DashboardEvaluationRepository,
  ) {}


  /**
   * Get all dashboard configurations for a project
   * @param projectId
   * @returns DashboardConfigurationEntity[]
   */
  public async getAllConfigurations(projectId: number): Promise<DashboardConfigurationEntity[]> {
    return this.dashboardConfigurationRepository.getAllByProjectId(projectId);
  }

  /**
   * Get dashboard configuration by ID, scoped to project
   * @param id
   * @param projectId
   * @throws NotFoundException
   * @returns DashboardConfigurationEntity
   */
  public async getConfigurationById(id: number, projectId: number): Promise<DashboardConfigurationEntity> {
    const config = await this.dashboardConfigurationRepository.getByIdAndProjectId(id, projectId);

    if (!config) {
      throw new NotFoundException("Dashboard configuration not found");
    }

    return config;
  }

  /**
   * Create a new dashboard configuration
   * @param projectId
   * @param data
   * @returns created DashboardConfigurationEntity
   */
  public async createConfiguration(projectId: number, data: DashboardConfigurationCreateRequest): Promise<DashboardConfigurationEntity> {
    return this.dashboardConfigurationRepository.create({
      projectId,
      name: data.name,
    });
  }

  /**
   * Update dashboard configuration name
   * @param id
   * @param projectId
   * @param data
   * @throws NotFoundException
   * @returns updated DashboardConfigurationEntity
   */
  public async updateConfiguration(id: number, projectId: number, data: DashboardConfigurationUpdateRequest): Promise<DashboardConfigurationEntity> {
    await this.getConfigurationById(id, projectId);

    return this.dashboardConfigurationRepository.update(id, {
      name: data.name,
    });
  }

  /**
   * Delete a dashboard configuration
   * @param id
   * @param projectId
   * @throws NotFoundException
   */
  public async deleteConfiguration(id: number, projectId: number): Promise<void> {
    await this.getConfigurationById(id, projectId);
    await this.dashboardConfigurationRepository.delete(id);
  }

  // --- Dashboard Configuration Item methods ---

  /**
   * Get all items for a dashboard configuration
   * @param dashboardConfigurationId
   * @returns DashboardConfigurationItemEntity[]
   */
  public async getAllItems(dashboardConfigurationId: number): Promise<DashboardConfigurationItemEntity[]> {
    return this.dashboardConfigurationItemRepository.getAllByDashboardConfigurationId(dashboardConfigurationId);
  }

  /**
   * Get item by ID, scoped to dashboard configuration
   * @param id
   * @param dashboardConfigurationId
   * @throws NotFoundException
   * @returns DashboardConfigurationItemEntity
   */
  public async getItemById(id: number, dashboardConfigurationId: number): Promise<DashboardConfigurationItemEntity> {
    const item = await this.dashboardConfigurationItemRepository.getByIdAndDashboardConfigurationId(id, dashboardConfigurationId);

    if (!item) {
      throw new NotFoundException("Dashboard configuration item not found");
    }

    return item;
  }

  /**
   * Create a new dashboard configuration item
   * @param dashboardConfigurationId
   * @param data
   * @returns created DashboardConfigurationItemEntity
   */
  public async createItem(dashboardConfigurationId: number, data: DashboardConfigurationItemCreateRequest): Promise<DashboardConfigurationItemEntity> {
    return this.dashboardConfigurationItemRepository.create({
      dashboardConfigurationId,
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

  /**
   * Update a dashboard configuration item
   * @param id
   * @param dashboardConfigurationId
   * @param data
   * @throws NotFoundException
   * @returns updated DashboardConfigurationItemEntity
   */
  public async updateItem(id: number, dashboardConfigurationId: number, data: DashboardConfigurationItemUpdateRequest): Promise<DashboardConfigurationItemEntity> {
    await this.getItemById(id, dashboardConfigurationId);

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

  /**
   * Delete a dashboard configuration item
   * @param id
   * @param dashboardConfigurationId
   * @throws NotFoundException
   */
  public async deleteItem(id: number, dashboardConfigurationId: number): Promise<void> {
    await this.getItemById(id, dashboardConfigurationId);
    await this.dashboardConfigurationItemRepository.delete(id);
  }

  // --- Dashboard Evaluation methods ---

  /**
   * Get evaluation for a dashboard configuration
   * @param dashboardConfigurationId
   * @returns DashboardEvaluationEntity or null
   */
  public async getEvaluation(dashboardConfigurationId: number): Promise<DashboardEvaluationEntity | null> {
    return this.dashboardEvaluationRepository.getByDashboardConfigurationId(dashboardConfigurationId);
  }

  /**
   * Create or update evaluation for a dashboard configuration
   * @param dashboardConfigurationId
   * @param data
   * @returns upserted DashboardEvaluationEntity
   */
  public async upsertEvaluation(dashboardConfigurationId: number, data: DashboardEvaluationUpsertRequest): Promise<DashboardEvaluationEntity> {
    return this.dashboardEvaluationRepository.upsert({
      dashboardConfigurationId,
      grade1AlertsBelow: data.grade1AlertsBelow,
      grade1WarningsBelow: data.grade1WarningsBelow,
      grade2AlertsBelow: data.grade2AlertsBelow,
      grade2WarningsBelow: data.grade2WarningsBelow,
      grade3AlertsBelow: data.grade3AlertsBelow,
      grade3WarningsBelow: data.grade3WarningsBelow,
      grade4AlertsBelow: data.grade4AlertsBelow,
      grade4WarningsBelow: data.grade4WarningsBelow,
    });
  }
}
