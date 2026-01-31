import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { User } from 'src/modules/auth/decorators/user.decorator';
import { ProjectService } from '../services/project.service';
import { ProjectGuard } from "../../auth/guards/project-guard";
import { ProjectId } from "../../auth/decorators/project-id.decorator";
import {
  ProjectCreateRequest,
  ProjectListResponse,
  ProjectResponse,
  ProjectUpdateRequest,
} from "../dto/project.dto";

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  public async list(@User('organizationId') organizationId: number): Promise<ProjectListResponse> {
    const projects = await this.projectService.getOrganizationProjects(organizationId);
    return { projects: projects.map((p) => p.toResponse()) };
  }

  @Post()
  public async create(
    @User('organizationId') organizationId: number,
    @Body() body: ProjectCreateRequest,
  ): Promise<ProjectResponse> {
    const project = await this.projectService.create(body, organizationId);
    return project.toResponse();
  }

  @Get(':projectId')
  @UseGuards(ProjectGuard)
  public async get(
    @ProjectId() projectId: number,
  ): Promise<ProjectResponse> {
    const project = await this.projectService.getProject(projectId);
    return project.toResponse();
  }


  @Put(':projectId')
  @UseGuards(ProjectGuard)
  public async update(
    @ProjectId() projectId: number,
    @Body() body: ProjectUpdateRequest,
  ): Promise<ProjectResponse> {
    const project = await this.projectService.update(projectId, body);
    return project.toResponse();
  }

  @Delete(':projectId')
  @UseGuards(ProjectGuard)
  public async delete(
    @ProjectId() projectId: number,
  ): Promise<void> {
    await this.projectService.delete(projectId);
  }
}
