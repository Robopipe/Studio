import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from "@nestjs/common";
import { ProjectLabelsService } from "../services/project-labels.service";
import { ProjectGuard } from "../../auth/guards/project-guard";
import { ProjectId } from "../../auth/decorators/project-id.decorator";
import {
  ProjectLabelCreateRequest,
  ProjectLabelResponse,
  ProjectLabelUpdateRequest,
} from "../dto/project-label.dto";

@Controller("project-labels/:projectId")
@UseGuards(ProjectGuard)
export class ProjectLabelsController {
  constructor(private readonly projectLabelsService: ProjectLabelsService) {}

  @Get()
  public async getLabels(
    @ProjectId() projectId: number,
  ): Promise<ProjectLabelResponse[]> {
    const labels = await this.projectLabelsService.getLabels(projectId)
    return labels.map((label) => label.toResponse())
  }


  @Post()
  public async createLabel(@ProjectId() projectId: number, @Body() data: ProjectLabelCreateRequest): Promise<ProjectLabelResponse> {
    const createdLabel = await this.projectLabelsService.createProjectLabel(projectId, data)
    return createdLabel.toResponse()
  }

  @Put(':labelId')
  public async updateLabel(@ProjectId() projectId: number, @Param("labelId", ParseIntPipe) labelId: number, @Body() data: ProjectLabelUpdateRequest): Promise<ProjectLabelResponse>{
    const updatedLabel = await this.projectLabelsService.updateProjectLabel(labelId, projectId, data)
    return updatedLabel.toResponse()
  }

  @Delete(":labelId")
  public async deleteLabel(@ProjectId() projectId: number, @Param("labelId", ParseIntPipe) labelId: number): Promise<void>{
    return this.projectLabelsService.deleteLabel(labelId, projectId)
  }
}
