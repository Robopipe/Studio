import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateProjectRequest, UpdateProjectRequest } from '@repo/schema';
import { ProjectEntity } from '../entities/project.entity';
import { ProjectRepository } from 'src/repository/services/project-repository.service';
import { DashboardConfigurationRepository } from 'src/repository/services/dashboard-configuration.service';

@Injectable()
export class ProjectService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly dashboardConfigurationRepository: DashboardConfigurationRepository,
  ) {}

  /**
   * Get project
   * @throws NotFoundException - Project not found
   * @returns Project entity
   */
  public async getProject(id: number): Promise<ProjectEntity> {
    const project = await this.projectRepository.getById(id);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  /**
   * Get org projects
   * @param organizationId
   * @returns Project entities
   */
  public async getOrganizationProjects(organizationId: number): Promise<ProjectEntity[]> {
    return this.projectRepository.getAllByOrganizationId(organizationId);
  }

  /**
   * Create project with a default dashboard configuration
   * @param data  - CreateProjectRequest
   * @param organizationId
   * @returns Created Project entity
   */
  public async create(data: CreateProjectRequest, organizationId: number): Promise<ProjectEntity> {
    const project = await this.projectRepository.create({ ...data, organizationId });

    await this.dashboardConfigurationRepository.create({
      projectId: project.id,
      name: 'Default dashboard',
    });

    return project;
  }

  /**
   * Update project
   * @param id - project ID
   * @param data - UpdateProjectRequest
   * @throws NotFoundException - Project not found
   * @returns - Updated project entity
   */
  public async update(
    id: number,
    data: UpdateProjectRequest,
  ): Promise<ProjectEntity> {
    const project = await this.projectRepository.getById(id);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.projectRepository.update(id, data);
  }

  /**
   * Delete project
   * @param id - project Id
   * @throws NotFoundException - Project not found
   */
  public async delete(id: number): Promise<void> {
    const project = await this.projectRepository.getById(id);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.projectRepository.delete(id);
  }
}
