import { Injectable } from "@nestjs/common";
import { RunConfigurationRepository } from "../../../repository/services/run-configuration.service";
import { RunConfigurationUpdateRequest } from "../dto/run-configuration.dto";
import { RunConfigurationEntity } from "../entity/run-configuration.entity";

@Injectable()
export class RunConfigurationService {
  constructor(
    private readonly runConfigurationRepository: RunConfigurationRepository,
  ) {}

  /**
   * Get the run configuration of a project, creating it on first access
   * @param projectId
   * @returns RunConfigurationEntity
   */
  public async getOrCreate(projectId: number): Promise<RunConfigurationEntity> {
    const config = await this.runConfigurationRepository.getByProjectId(projectId);

    if (config) {
      return config;
    }

    return this.runConfigurationRepository.create({ projectId });
  }

  /**
   * Update the run configuration of a project
   * @param projectId
   * @param data
   * @returns updated RunConfigurationEntity
   */
  public async update(projectId: number, data: RunConfigurationUpdateRequest): Promise<RunConfigurationEntity> {
    const config = await this.getOrCreate(projectId);

    const updateData: Record<string, unknown> = {};
    if (data.modelId !== undefined) updateData.modelId = data.modelId;
    if (data.streamName !== undefined) updateData.streamName = data.streamName;
    if (data.capturedVideoId !== undefined) updateData.capturedVideoId = data.capturedVideoId;

    if (Object.keys(updateData).length === 0) {
      return config;
    }

    return this.runConfigurationRepository.updateByProjectId(projectId, updateData);
  }
}
