import {
  Body,
  Controller, Delete,
  Get,
  Param,
  ParseIntPipe,
  Post, Put,
  UseGuards,
} from "@nestjs/common";
import { ProjectGuard } from "../../auth/guards/project-guard";
import { ModelService } from "../services/model.service";
import { ProjectId } from "../../auth/decorators/project-id.decorator";
import {
  ModelCreateRequest,
  ModelResponse,
  ModelUpdateRequest,
} from "../dto/model.dto";
import { ModelOutputResponse } from "../dto/model-output.dto";

@Controller("model/:projectId")
@UseGuards(ProjectGuard)
export class ModelController {
  constructor(private readonly modelService: ModelService) {}

  @Get()
  public async getModels(@ProjectId() projectId: number): Promise<ModelResponse[]>{
    const models = await this.modelService.getModels(projectId)
    return models.map((model) => model.toResponse())
  }

  @Get(":modelId")
  public async getModel(
    @ProjectId() projectId: number,
    @Param("modelId", ParseIntPipe) modelId: number,
  ): Promise<ModelResponse>{
    const model = await this.modelService.getModelById(modelId, projectId)
    return model.toResponse()
  }


  @Post()
  public async createModel(
    @ProjectId() projectId: number,
    @Body() data: ModelCreateRequest
  ): Promise<ModelResponse>{
    const model = await this.modelService.createModel(projectId, data)
    return model.toResponse()
  }


  @Put(":modelId")
  public async updateModel(
    @ProjectId() projectId: number,
    @Param("modelId", ParseIntPipe) modelId: number,
    @Body() data: ModelUpdateRequest
  ): Promise<ModelResponse>{
    const model = await this.modelService.updateModel(modelId, projectId, data)
    return model.toResponse()
  }


  @Get(":modelId/outputs")
  public async getModelOutputs(
    @ProjectId() projectId: number,
    @Param("modelId", ParseIntPipe) modelId: number,
  ): Promise<ModelOutputResponse[]>{
    const modelOutputs = await this.modelService.getModelOutputs(modelId, projectId)
    return modelOutputs.map((modelOutput) => modelOutput.toResponse())
  }


  @Delete(":modelId")
  public async deleteModel(
    @ProjectId() projectId: number,
    @Param("modelId", ParseIntPipe) modelId: number,
  ): Promise<void>{
    await this.modelService.deleteModel(modelId, projectId);
  }
}
