import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from "@nestjs/common";
import { ProjectGuard } from "src/modules/auth/guards/project-guard";
import { ProjectId } from "src/modules/auth/decorators/project-id.decorator";
import { EvalTestCaseService } from "../services/eval-test-case.service";
import { EvalTestCaseCreateOrUpdateDto, EvalTestCaseFullCreateOrUpdateDto } from "../dto/eval-test-case.dto";
import { EvalTestCase, EvalTestCaseDetail } from "@repo/schema";

@Controller("eval/:projectId/config/:configId/test-case")
@UseGuards(ProjectGuard)
export class EvalTestCaseController {
  constructor(private readonly evalTestCaseService: EvalTestCaseService){}

  @Get()
  public async getTestCases(
    @ProjectId() projectId: number,
    @Param("configId", ParseIntPipe) configId: number,
  ): Promise<EvalTestCase[]>{
    const testCases = await this.evalTestCaseService.getTestCases(projectId, configId)
    return testCases.map((testCase) => testCase.toResponse())
  }


  @Get(':testCaseId')
  public async getTestCaseDetail(
    @ProjectId() projectId: number,
    @Param("configId", ParseIntPipe) configId: number,
    @Param("testCaseId") testCaseId: string
  ): Promise<EvalTestCaseDetail>{
    const testCaseDetail = await this.evalTestCaseService.getTestCaseDetail(projectId, configId, testCaseId);
    return testCaseDetail.toDetailResponse()
  }


  @Post()
  public async createTestCase(
    @ProjectId() projectId: number,
    @Param("configId", ParseIntPipe) configId: number,
    @Body() data: EvalTestCaseCreateOrUpdateDto
  ): Promise<EvalTestCaseDetail>{
    const createdTestCase = await this.evalTestCaseService.createTestCase(projectId, configId, data)
    return createdTestCase.toDetailResponse()
  }


  @Post("full")
  public async createTestCaseFull(
    @ProjectId() projectId: number,
    @Param("configId", ParseIntPipe) configId: number,
    @Body() data: EvalTestCaseFullCreateOrUpdateDto
  ): Promise<EvalTestCaseDetail>{
    const createdTestCase = await this.evalTestCaseService.createTestCaseFull(projectId, configId, data)
    return createdTestCase.toDetailResponse()
  }


  @Put(":testCaseId")
  public async updateTestCase(
    @ProjectId() projectId: number,
    @Param("configId", ParseIntPipe) configId: number,
    @Param("testCaseId") testCaseId: string,
    @Body() data: EvalTestCaseCreateOrUpdateDto
  ): Promise<EvalTestCaseDetail>{
    const updatedTestCase = await this.evalTestCaseService.updateTestCase(projectId, configId, testCaseId, data)
    return updatedTestCase.toDetailResponse()
  }


  @Put(":testCaseId/full")
  public async updateTestCaseFull(
    @ProjectId() projectId: number,
    @Param("configId", ParseIntPipe) configId: number,
    @Param("testCaseId") testCaseId: string,
    @Body() data: EvalTestCaseFullCreateOrUpdateDto
  ): Promise<EvalTestCaseDetail>{
    const updatedTestCase = await this.evalTestCaseService.updateTestCaseFull(projectId, configId, testCaseId, data)
    return updatedTestCase.toDetailResponse()
  }


  @Delete(":testCaseId")
  public async deleteTestCase(
    @ProjectId() projectId: number,
    @Param("configId", ParseIntPipe) configId: number,
    @Param("testCaseId") testCaseId: string
  ): Promise<void>{
    return this.evalTestCaseService.deleteTestCase(projectId, configId, testCaseId)
  }
}
