import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { ProjectLabelRepository } from "../../../repository/services/project-label-repository.service";
import { ProjectLabelEntity } from "../entities/project-label.entity";
import {
  ProjectLabelCreateRequest,
  ProjectLabelUpdateRequest,
} from "../dto/project-label.dto";

@Injectable()
export class ProjectLabelsService {
  constructor(private readonly projectLabelRepository: ProjectLabelRepository) {}

  /**
   * Get project labels
   * @param projectId
   * @returns ProjectLabelEntity
   */
  public async getLabels(projectId: number): Promise<ProjectLabelEntity[]>{
    return this.projectLabelRepository.getAllByProjectId(projectId)
  }

  /**
   * Update project label
   * @param id
   * @param projectId
   * @param data - ProjectLabelUpdateRequest
   * @throws NotFoundException - Project label not found
   */
  public async updateProjectLabel(id: number, projectId: number, data: ProjectLabelUpdateRequest): Promise<ProjectLabelEntity>{
    const label = await this.projectLabelRepository.getByIdAndProjectId(id, projectId)
    if(!label){
      throw new NotFoundException("Project label not found")
    }

    return this.projectLabelRepository.update(id, {
      name: data.name,
      color: data.color
    })
  }

  /**
   * Create project label
   * @param projectId
   * @param data - ProjectLabelCreateRequest
   * @throws ConflictException - Project label with this name already exists
   * @returns ProjectLabelEntity
   */
  public async createProjectLabel(projectId: number, data: ProjectLabelCreateRequest): Promise<ProjectLabelEntity>{
    const projectLabels = await this.projectLabelRepository.getAllByProjectId(projectId)
    const labelExists = projectLabels.some((label) => label.name === data.name)

    if(labelExists){
      throw new ConflictException("Project label with this name already exists")
    }

    // If a soft-deleted label with this name exists, restore it instead of inserting
    const deletedLabel = await this.projectLabelRepository.getDeletedByNameAndProjectId(data.name, projectId)
    if(deletedLabel){
      return this.projectLabelRepository.restore(deletedLabel.id, {
        name: data.name,
        color: data.color,
      })
    }

    return this.projectLabelRepository.create({
      ...data,
      projectId
    })
  }

  /**
   * Delete project label
   * @param id
   * @param projectId
   * @throws NotFoundException - Project label not found
   */
  public async deleteLabel(id: number, projectId: number): Promise<void>{
    const label = await this.projectLabelRepository.getByIdAndProjectId(id, projectId)

    if(!label){
      throw new NotFoundException("Project label not found")
    }

    await this.projectLabelRepository.delete(id)
  }
}
