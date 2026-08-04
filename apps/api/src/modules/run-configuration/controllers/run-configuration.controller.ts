import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import { ProjectGuard } from "../../auth/guards/project-guard";
import { ProjectId } from "../../auth/decorators/project-id.decorator";
import { RunConfigurationService } from "../services/run-configuration.service";
import {
  RunConfigurationResponse,
  RunConfigurationUpdateRequest,
} from "../dto/run-configuration.dto";

@Controller("run-config/:projectId")
@UseGuards(ProjectGuard)
export class RunConfigurationController {
  constructor(private readonly runConfigurationService: RunConfigurationService) {}

  @Get()
  public async get(@ProjectId() projectId: number): Promise<RunConfigurationResponse> {
    const config = await this.runConfigurationService.getOrCreate(projectId);
    return config.toResponse();
  }

  @Put()
  public async update(
    @ProjectId() projectId: number,
    @Body() data: RunConfigurationUpdateRequest,
  ): Promise<RunConfigurationResponse> {
    const config = await this.runConfigurationService.update(projectId, data);
    return config.toResponse();
  }
}
