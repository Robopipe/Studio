import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from "@nestjs/common";
import { ProjectId } from "src/modules/auth/decorators/project-id.decorator";
import { ProjectGuard } from "src/modules/auth/guards/project-guard";
import { EvalThresholdService } from "../services/eval-threshold.service";
import { EvalThresholdCreateOrUpdateDto } from "../dto/eval-threshold.dto";
import { EvalThreshold, EvalThresholdsResponse } from "@repo/schema";

@Controller("eval/:projectId/config/:configId/threshold")
@UseGuards(ProjectGuard)
export class EvalThresholdController{
  constructor(private readonly evalThresholdService: EvalThresholdService){}

  @Get()
  public async getAll(
    @ProjectId() projectId: number,
    @Param("configId", ParseIntPipe) configId: number,
  ): Promise<EvalThresholdsResponse> {
    const { testCases, master } = await this.evalThresholdService.getAll(projectId, configId)
    return {
      testCases: testCases.map((tc) => tc.toResponse()),
      master: master.map((t) => t.toResponse()),
    }
  }

  @Post()
  public async createMasterThreshold(
    @ProjectId() projectId: number,
    @Param("configId", ParseIntPipe) configId: number,
    @Body() data: EvalThresholdCreateOrUpdateDto
  ): Promise<EvalThreshold>{
    const threshold = await this.evalThresholdService.create(projectId, configId, undefined, data);
    return threshold.toResponse()
  }

  @Post(':testCaseId')
  public async createThreshold(
    @ProjectId() projectId: number,
    @Param("configId", ParseIntPipe) configId: number,
    @Param("testCaseId") testCaseId: string,
    @Body() data: EvalThresholdCreateOrUpdateDto
  ): Promise<EvalThreshold>{
    const threshold = await this.evalThresholdService.create(projectId, configId, testCaseId, data);
    return threshold.toResponse()
  }

  @Put(":thresholdId")
  public async updateThreshold(
    @ProjectId() projectId: number,
    @Param("configId", ParseIntPipe) configId: number,
    @Param("thresholdId") thresholdId: string,
    @Body() data: EvalThresholdCreateOrUpdateDto
  ): Promise<EvalThreshold>{
    const threshold = await this.evalThresholdService.update(projectId, configId, thresholdId, data)
    return threshold.toResponse()
  }

  @Delete(":thresholdId")
  public async deleteThreshold(
    @ProjectId() projectId: number,
    @Param("configId", ParseIntPipe) configId: number,
    @Param("thresholdId") thresholdId: string,
  ): Promise<void>{
    await this.evalThresholdService.delete(projectId, configId, thresholdId)
  }
}
