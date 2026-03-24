import { Injectable, NotFoundException } from "@nestjs/common";
import { DashboardConfigurationRepository } from "../../../repository/services/dashboard-configuration.service";
import { DashboardEvaluationRepository } from "../../../repository/services/dashboard-evaluation.service";
import {
  DashboardConfigurationCreateRequest,
  DashboardConfigurationUpdateRequest,
} from "../dto/dashboard-configuration.dto";
import { DashboardEvaluationUpsertRequest } from "../dto/dashboard-evaluation.dto";
import { DashboardConfigurationEntity } from "../entity/dashboard-configuration.entity";
import { DashboardEvaluationEntity } from "../entity/dashboard-evaluation.entity";

@Injectable()
export class DashboardService {
  constructor(
    private readonly dashboardConfigurationRepository: DashboardConfigurationRepository,
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

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.modelId !== undefined) updateData.modelId = data.modelId;

    return this.dashboardConfigurationRepository.update(id, updateData);
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

  // --- Dashboard Evaluation methods ---

  /**
   * Get evaluation for a dashboard configuration
   * @param dashboardConfigurationId
   * @param projectId
   * @throws NotFoundException - if config doesn't belong to project
   * @returns DashboardEvaluationEntity or null
   */
  public async getEvaluation(dashboardConfigurationId: number, projectId: number): Promise<DashboardEvaluationEntity | null> {
    await this.getConfigurationById(dashboardConfigurationId, projectId);
    return this.dashboardEvaluationRepository.getByDashboardConfigurationId(dashboardConfigurationId);
  }

  /**
   * Create or update evaluation for a dashboard configuration
   * @param dashboardConfigurationId
   * @param projectId
   * @param data
   * @throws NotFoundException - if config doesn't belong to project
   * @returns upserted DashboardEvaluationEntity
   */
  public async upsertEvaluation(dashboardConfigurationId: number, projectId: number, data: DashboardEvaluationUpsertRequest): Promise<DashboardEvaluationEntity> {
    await this.getConfigurationById(dashboardConfigurationId, projectId);
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
