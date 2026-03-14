import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { ProjectId } from "src/modules/auth/decorators/project-id.decorator";
import { ProjectGuard } from "src/modules/auth/guards/project-guard";
import { EvalThresholdService } from "../services/eval-threshold.service";
import { EvalThresholdCreateOrUpdateDto } from "../dto/eval-threshold.dto";
import { EvalTestCaseThreshold } from "@repo/schema";

@Controller("eval/:projectId/threshold")
@UseGuards(ProjectGuard)
export class EvalThresholdController{
  constructor(private readonly evalThresholdService: EvalThresholdService){}

  @Get()
  public async getThresholds(
    @ProjectId() projectId: number
  ): Promise<EvalTestCaseThreshold[]> {
    const thresholds = await this.evalThresholdService.getThresholds(projectId)
    return thresholds.map((threshold) => threshold.toResponse())
  }

  @Post(':testCaseId')
  public async createThreshold(
    @ProjectId() projectId: number,
    @Param("testCaseId") testCaseId: string,
    @Body() data: EvalThresholdCreateOrUpdateDto
  ): Promise<EvalTestCaseThreshold>{
    const testCaseThreshold = await this.evalThresholdService.createThreshold(projectId, testCaseId, data);
    return testCaseThreshold.toResponse()
  }

  @Put(":testCaseId/:thresholdId")
  public async updateThreshold(
    @ProjectId() projectId: number,
    @Param("testCaseId") testCaseId: string,
    @Param("thresholdId") thresholdId: string,
    @Body() data: EvalThresholdCreateOrUpdateDto
  ): Promise<EvalTestCaseThreshold>{
    const testCaseThreshold = await this.evalThresholdService.updateThreshold(projectId, testCaseId, thresholdId, data)
    return testCaseThreshold.toResponse()
  }

  @Delete(":testCaseId/:thresholdId")
  public async deleteThreshold(
    @ProjectId() projectId: number,
    @Param("testCaseId") testCaseId: string,
    @Param("thresholdId") thresholdId: string,
  ): Promise<EvalTestCaseThreshold>{
    const testCaseThreshold = await this.evalThresholdService.deleteThreshold(projectId, testCaseId, thresholdId)
    return testCaseThreshold.toResponse()
  }
}
