import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { EvalTestCaseRepository } from "src/repository/services/eval-test-case.service";
import { EvalThresholdRepository } from "src/repository/services/eval-threshold.service";
import { EvalTestCaseThresholdEntity } from "../entities/eval-test-case.entity";
import { EvalThresholdCreateOrUpdateDto } from "../dto/eval-threshold.dto";

@Injectable()
export class EvalThresholdService {
  constructor(
    private readonly evalThresholdRepository: EvalThresholdRepository,
    private readonly evalTestCaseRepository: EvalTestCaseRepository
  ){}

  /**
   * Get project thresholds
   * @param projectId
   * @returns EvalTestCaseThresholdEntity[]
   */
  public async getThresholds(projectId: number): Promise<EvalTestCaseThresholdEntity[]>{
    return this.evalTestCaseRepository.getAllThresholdsByProjectId(projectId);
  }

  /**
   * Create threshold
   * @param projectId
   * @param testCaseId
   * @param data - EvalThresholdCreateOrUpdateDto
   * @throws NotFoundException - Test case not found
   * @throws BadRequestException - Threshold value can't be 0 or higher than or equal to 1
   * @returns EvalTestCaseThresholdEntity
   */
  public async createThreshold(projectId: number, testCaseId: string, data: EvalThresholdCreateOrUpdateDto): Promise<EvalTestCaseThresholdEntity>{
    await this.evalTestCaseRepository.getByIdAndProjectIdOrThrow(testCaseId, projectId);

    if(data.value <= 0 || data.value >= 1){
      throw new BadRequestException("Threshold value can't be 0 or higher than or equal to 1")
    }

    await this.evalThresholdRepository.create(testCaseId, data)
    return this.evalTestCaseRepository.getThresholdByIdAndProjectIdOrThrow(testCaseId, projectId)
  }

  /**
   * Update threshold
   * @param projectId
   * @param testCaseId
   * @param thresholdId
   * @param data - EvalThresholdCreateOrUpdateDto
   * @throws NotFoundException - Test case not found
   * @throws NotFoundException - Threshold not found
   * @throws ConflictException - Threshold with this value already exists
   * @throws BadRequestException - You can't update the last threshold's value
   * @returns EvalTestCaseThresholdEntity
   */
  public async updateThreshold(projectId: number, testCaseId: string, thresholdId: string, data: EvalThresholdCreateOrUpdateDto): Promise<EvalTestCaseThresholdEntity>{
    await this.evalTestCaseRepository.getByIdAndProjectIdOrThrow(testCaseId, projectId);
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
   * Delete threshold
   * @param projectId
   * @param testCaseId
   * @param thresholdId
   * @throws NotFoundException - Test case not found
   * @throws NotFoundException - Threshold not found
   * @throws BadRequestException - You can't delete the last threshold
   */
  public async deleteThreshold(projectId: number, testCaseId: string, thresholdId: string): Promise<EvalTestCaseThresholdEntity>{
    await this.evalTestCaseRepository.getByIdAndProjectIdOrThrow(testCaseId, projectId);
    const foundThreshold = await this.evalThresholdRepository.getByIdAndTestCaseIdOrThrow(thresholdId, testCaseId)

    if(foundThreshold.value === 1){
      throw new BadRequestException("You can't delete the last threshold")
    }

    await this.evalThresholdRepository.delete(thresholdId, testCaseId)
    return this.evalTestCaseRepository.getThresholdByIdAndProjectIdOrThrow(testCaseId, projectId)
  }
}
