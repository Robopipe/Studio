import { Injectable } from "@nestjs/common";
import { EvalTestCaseDetailEntity, EvalTestCaseEntity } from "../entities/eval-test-case.entity";
import { EvalTestCaseCreateOrUpdateDto } from "../dto/eval-test-case.dto";
import { EvalTestCaseRepository } from "src/repository/services/eval-test-case.service";

@Injectable()
export class EvalTestCaseService {
  constructor(private readonly evalTestCaseRepository: EvalTestCaseRepository){}

  /**
   * Get project test cases
   * @param projectId
   * @returns EvalTestCaseEntity[]
   */
  public async getTestCases(projectId: number): Promise<EvalTestCaseEntity[]>{
    return this.evalTestCaseRepository.getAllByProjectId(projectId)
  }


  /**
   * Get test case detail
   * @param projectId
   * @param testCaseId
   * @throws NotFoundException - Test case not found
   * @returns EvalTestCaseDetailEntity
   */
  public async getTestCaseDetail(projectId: number, testCaseId: string): Promise<EvalTestCaseDetailEntity>{
    return this.evalTestCaseRepository.getByIdAndProjectIdOrThrow(testCaseId, projectId)
  }


  /**
   * Create test case
   * @param projectId
   * @param data - EvalTestCaseCreateOrUpdateDto
   * @returns EvalTestCaseDetailEntity
   */
  public async createTestCase(projectId: number, data: EvalTestCaseCreateOrUpdateDto): Promise<EvalTestCaseDetailEntity> {
    return this.evalTestCaseRepository.create(projectId, {
      logicNodes: [],
      ...data,
    })
  }


  /**
   * Update test case
   * @param projectId
   * @param testCaseId
   * @param data - EvalTestCaseCreateOrUpdateDto
   * @throws NotFoundException - Test case not found
   * @returns EvalTestCaseDetailEntity
   */
  public async updateTestCase(projectId: number, testCaseId: string, data: EvalTestCaseCreateOrUpdateDto): Promise<EvalTestCaseDetailEntity>{
    const testCase = await this.evalTestCaseRepository.getByIdAndProjectIdOrThrow(testCaseId, projectId)

    return this.evalTestCaseRepository.update(testCaseId, projectId, {
      logicNodes: testCase.logicNodes,
      ...data
    })
  }


  /**
   * Delete test case
   * @param projectId
   * @param testCaseId
   */
  public async deleteTestCase(projectId: number, testCaseId: string): Promise<void>{
    await this.evalTestCaseRepository.getByIdAndProjectIdOrThrow(testCaseId, projectId)
    return this.evalTestCaseRepository.delete(testCaseId, projectId)
  }
}
