import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import type {
  CreateProjectRequest,
  Project,
  ProjectListResponse,
  UpdateProjectRequest,
} from '@repo/schema';
import { User } from 'src/modules/auth/decorators/user.decorator';
import { ProjectService } from '../services/project.service';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  public async list(@User('organizationId') organizationId: number): Promise<ProjectListResponse> {
    const projects = await this.projectService.getOrganizationProjects(organizationId);
    return { projects: projects.map((p) => p.toDto()) };
  }

  @Get(':id')
  public async get(
    @User('organizationId') organizationId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Project> {
    const project = await this.projectService.getProject(id, organizationId);
    return project.toDto();
  }

  @Post()
  public async create(
    @User('organizationId') organizationId: number,
    @Body() body: CreateProjectRequest,
  ): Promise<Project> {
    const project = await this.projectService.create(body, organizationId);
    return project.toDto();
  }

  @Patch(':id')
  public async update(
    @User('organizationId') organizationId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateProjectRequest,
  ): Promise<Project> {
    const project = await this.projectService.update(id, body, organizationId);
    return project.toDto();
  }

  @Delete(':id')
  public async delete(
    @User('organizationId') organizationId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.projectService.delete(id, organizationId);
  }
}
