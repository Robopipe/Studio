import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { EvalTestCaseRepository } from "src/repository/services/eval-test-case.service";
import { EvalThresholdRepository } from "src/repository/services/eval-threshold.service";
import { EvalTestCaseThresholdEntity } from "../entities/eval-test-case.entity";
import { EvalThresholdCreateOrUpdateDto } from "../dto/eval-threshold.dto";

@Injectable()
export class EvalThresholdService {
  constructor(
    private readonly evalThresholdRepository: EvalThresholdRepository,
    private readonly evalTestCaseRepository: EvalTestCaseRepository,
  ){}

  /**
   * Get thresholds for a dashboard configuration.
   * No separate config check — query filters by both projectId + configId,
   * so a mismatched configId simply returns empty array (no data leakage).
   */
  public async getThresholds(projectId: number, configId: number): Promise<EvalTestCaseThresholdEntity[]>{
    return this.evalTestCaseRepository.getAllThresholdsByProjectId(projectId, configId);
  }

  /**
   * Create threshold — single ownership query for project + config + test case.
   */
  public async createThreshold(projectId: number, configId: number, testCaseId: string, data: EvalThresholdCreateOrUpdateDto): Promise<EvalTestCaseThresholdEntity>{
    await this.evalTestCaseRepository.verifyOwnership(testCaseId, projectId, configId);

    if(data.value <= 0 || data.value >= 1){
      throw new BadRequestException("Threshold value can't be 0 or higher than or equal to 1")
    }

    await this.evalThresholdRepository.create(testCaseId, data)
    return this.evalTestCaseRepository.getThresholdByIdAndProjectIdOrThrow(testCaseId, projectId)
  }

  /**
   * Update threshold.
   */
  public async updateThreshold(projectId: number, configId: number, testCaseId: string, thresholdId: string, data: EvalThresholdCreateOrUpdateDto): Promise<EvalTestCaseThresholdEntity>{
    await this.evalTestCaseRepository.verifyOwnership(testCaseId, projectId, configId);

    const existingThresholds = await this.evalThresholdRepository.getAllByTestCaseId(testCaseId)
    const foundThreshold = existingThresholds.find((threshold) => threshold.id === thresholdId)
    const foundThresholdByValue = existingThresholds.find((threshold) => threshold.value === data.value && threshold.id !== thresholdId)

    if(!foundThreshold){
      throw new NotFoundException("Threshold not found")
    }

    if(foundThresholdByValue){
      throw new ConflictException("Threshold with this value already exists")
    }

    if(foundThreshold.value === 1 && data.value !== 1){
      throw new BadRequestException("You can't update the last threshold's value")
    }

    await this.evalThresholdRepository.update(thresholdId, testCaseId, data)
    return this.evalTestCaseRepository.getThresholdByIdAndProjectIdOrThrow(testCaseId, projectId)
  }

  /**
   * Delete threshold.
   */
  public async deleteThreshold(projectId: number, configId: number, testCaseId: string, thresholdId: string): Promise<EvalTestCaseThresholdEntity>{
    await this.evalTestCaseRepository.verifyOwnership(testCaseId, projectId, configId);

    const foundThreshold = await this.evalThresholdRepository.getByIdAndTestCaseIdOrThrow(thresholdId, testCaseId)

    if(foundThreshold.value === 1){
      throw new BadRequestException("You can't delete the last threshold")
    }

    await this.evalThresholdRepository.delete(thresholdId, testCaseId)
    return this.evalTestCaseRepository.getThresholdByIdAndProjectIdOrThrow(testCaseId, projectId)
  }
}
