import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from "@nestjs/common";
import { ProjectId } from "src/modules/auth/decorators/project-id.decorator";
import { ProjectGuard } from "src/modules/auth/guards/project-guard";
import { EvalLimitService } from "../services/eval-limit.service";
import { EvalLimit, EvalLimitDetail } from "@repo/schema";
import { EvalLimitCreateOrUpdateDto } from "../dto/eval-limit.dto";

@Controller("eval/:projectId/config/:configId/limit/:testCaseId")
@UseGuards(ProjectGuard)
export class EvalLimitController {
  constructor(private readonly evalLimitService: EvalLimitService){}


  @Get()
  public async getTestCaseLimits(
    @ProjectId() projectId: number,
    @Param("configId", ParseIntPipe) configId: number,
    @Param("testCaseId") testCaseId: string,
  ): Promise<EvalLimit[]> {
    const testCaseLimits = await this.evalLimitService.getTestCaseLimits(projectId, configId, testCaseId)
    return testCaseLimits.map((limit) => limit.toResponse())
  }

  @Get(':limitId')
  public async getLimitDetail(
    @ProjectId() projectId: number,
    @Param("configId", ParseIntPipe) configId: number,
    @Param("testCaseId") testCaseId: string,
    @Param("limitId") limitId: string
  ): Promise<EvalLimitDetail>{
    const limit = await this.evalLimitService.getLimitDetail(projectId, configId, testCaseId, limitId)
    return limit.toDetailResponse()
  }

  @Post()
  public async createLimit(
    @ProjectId() projectId: number,
    @Param("configId", ParseIntPipe) configId: number,
    @Param("testCaseId") testCaseId: string,
    @Body() data: EvalLimitCreateOrUpdateDto
  ): Promise<EvalLimitDetail>{
    const createdLimit = await this.evalLimitService.createLimit(projectId, configId, testCaseId, data)
    return createdLimit.toDetailResponse()
  }

  @Put(":limitId")
  public async updateLimit(
    @ProjectId() projectId: number,
    @Param("configId", ParseIntPipe) configId: number,
    @Param("testCaseId") testCaseId: string,
    @Param("limitId") limitId: string,
    @Body() data: EvalLimitCreateOrUpdateDto
  ): Promise<EvalLimitDetail>{
    const updatedLimit = await this.evalLimitService.updateLimit(projectId, configId, testCaseId, limitId, data)
    return updatedLimit.toDetailResponse()
  }

  @Delete(":limitId")
  public async deleteLimit(
    @ProjectId() projectId: number,
    @Param("configId", ParseIntPipe) configId: number,
    @Param("testCaseId") testCaseId: string,
    @Param("limitId") limitId: string
  ): Promise<void> {
    return this.evalLimitService.deleteLimit(projectId, configId, testCaseId, limitId)
  }
}
