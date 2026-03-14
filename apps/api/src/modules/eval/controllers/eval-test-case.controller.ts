import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { ProjectGuard } from "src/modules/auth/guards/project-guard";
import { ProjectId } from "src/modules/auth/decorators/project-id.decorator";
import { EvalTestCaseService } from "../services/eval-test-case.service";
import { EvalTestCaseCreateOrUpdateDto } from "../dto/eval-test-case.dto";
import { EvalTestCase, EvalTestCaseDetail } from "@repo/schema";

@Controller("eval/:projectId/test-case")
@UseGuards(ProjectGuard)
export class EvalTestCaseController {
  constructor(private readonly evalTestCaseService: EvalTestCaseService){}

  @Get()
  public async getTestCases(@ProjectId() projectId: number): Promise<EvalTestCase[]>{
    const testCases = await this.evalTestCaseService.getTestCases(projectId)
    return testCases.map((testCase) => testCase.toResponse())
  }


  @Get(':testCaseId')
  public async getTestCaseDetail(
    @ProjectId() projectId: number,
    @Param("testCaseId") testCaseId: string
  ): Promise<EvalTestCaseDetail>{
    const testCaseDetail = await this.evalTestCaseService.getTestCaseDetail(projectId, testCaseId);
    return testCaseDetail.toDetailResponse()
  }


  @Post()
  public async createTestCase(
    @ProjectId() projectId: number,
    @Body() data: EvalTestCaseCreateOrUpdateDto
  ): Promise<EvalTestCaseDetail>{
    const createdTestCase = await this.evalTestCaseService.createTestCase(projectId, data)
    return createdTestCase.toDetailResponse()
  }


  @Put(":testCaseId")
  public async updateTestCase(
    @ProjectId() projectId: number,
    @Param("testCaseId") testCaseId: string,
    @Body() data: EvalTestCaseCreateOrUpdateDto
  ): Promise<EvalTestCaseDetail>{
    const updatedTestCase = await this.evalTestCaseService.updateTestCase(projectId, testCaseId, data)
    return updatedTestCase.toDetailResponse()
  }


  @Delete(":testCaseId")
  public async deleteTestCase(
    @ProjectId() projectId: number,
    @Param("testCaseId") testCaseId: string
  ): Promise<void>{
    return this.evalTestCaseService.deleteTestCase(projectId, testCaseId)
  }
}
