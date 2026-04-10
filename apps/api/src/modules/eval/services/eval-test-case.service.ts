import { Injectable } from "@nestjs/common";
import { EvalTestCaseDetailEntity, EvalTestCaseEntity } from "../entities/eval-test-case.entity";
import { EvalTestCaseCreateOrUpdateDto } from "../dto/eval-test-case.dto";
import { EvalTestCaseRepository } from "src/repository/services/eval-test-case.service";
import { EvalThresholdRepository } from "src/repository/services/eval-threshold.service";
import { DashboardConfigurationRepository } from "src/repository/services/dashboard-configuration.service";
import { defaultThresholds } from "../data/eval-threshold.data";
import { NotFoundException } from "@nestjs/common";

@Injectable()
export class EvalTestCaseService {
  constructor(
    private readonly evalTestCaseRepository: EvalTestCaseRepository,
    private readonly evalThresholdRepository: EvalThresholdRepository,
    private readonly dashboardConfigurationRepository: DashboardConfigurationRepository,
  ){}

  /**
   * Verify that dashboard configuration belongs to the project.
   * Used only for create (where no test case exists yet to verify against).
   * @throws NotFoundException
   */
  private async verifyConfigOwnership(configId: number, projectId: number): Promise<void> {
    const config = await this.dashboardConfigurationRepository.getByIdAndProjectId(configId, projectId);
    if (!config) {
      throw new NotFoundException("Dashboard configuration not found");
    }
  }

  /**
   * Get test cases for a dashboard configuration.
   * No separate config check needed — query filters by both projectId + configId,
   * so a mismatched configId simply returns empty array (no data leakage).
   */
  public async getTestCases(projectId: number, configId: number): Promise<EvalTestCaseEntity[]>{
    return this.evalTestCaseRepository.getAllByProjectId(projectId, configId)
  }

  /**
   * Get test case detail — single query verifies project + config + test case ownership.
   */
  public async getTestCaseDetail(projectId: number, configId: number, testCaseId: string): Promise<EvalTestCaseDetailEntity>{
    return this.evalTestCaseRepository.getDetailOrThrow(testCaseId, projectId, configId);
  }

  /**
   * Create test case — must verify config belongs to project first (no test case to check yet).
   */
  public async createTestCase(projectId: number, configId: number, data: EvalTestCaseCreateOrUpdateDto): Promise<EvalTestCaseDetailEntity> {
    await this.verifyConfigOwnership(configId, projectId);
    const createdTestCase = await this.evalTestCaseRepository.create(projectId, configId, {
      logicNodes: [],
      ...data,
    })

    await this.evalThresholdRepository.createManyForTestCase(createdTestCase.id, defaultThresholds)

    return createdTestCase
  }

  /**
   * Update test case — single query verifies all ownership, then update.
   */
  public async updateTestCase(projectId: number, configId: number, testCaseId: string, data: EvalTestCaseCreateOrUpdateDto): Promise<EvalTestCaseDetailEntity>{
    const testCase = await this.evalTestCaseRepository.getDetailOrThrow(testCaseId, projectId, configId)

    return this.evalTestCaseRepository.update(testCaseId, projectId, {
      logicNodes: testCase.logicNodes,
      ...data
    })
  }

  /**
   * Delete test case — lightweight ownership check, then delete.
   */
  public async deleteTestCase(projectId: number, configId: number, testCaseId: string): Promise<void>{
    await this.evalTestCaseRepository.verifyOwnership(testCaseId, projectId, configId)
    return this.evalTestCaseRepository.delete(testCaseId, projectId)
  }
}
