import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { DashboardConfigurationRepository } from "src/repository/services/dashboard-configuration.service";
import { EvalTestCaseRepository } from "src/repository/services/eval-test-case.service";
import { EvalThresholdRepository } from "src/repository/services/eval-threshold.service";
import { EvalTestCaseThresholdEntity } from "../entities/eval-test-case.entity";
import { EvalThresholdEntity } from "../entities/eval-threshold.entity";
import { EvalThresholdCreateOrUpdateDto } from "../dto/eval-threshold.dto";

@Injectable()
export class EvalThresholdService {
  constructor(
    private readonly evalThresholdRepository: EvalThresholdRepository,
    private readonly evalTestCaseRepository: EvalTestCaseRepository,
    private readonly dashboardConfigurationRepository: DashboardConfigurationRepository,
  ){}

  private async verifyConfigOwnership(configId: number, projectId: number): Promise<void> {
    const config = await this.dashboardConfigurationRepository.getByIdAndProjectId(configId, projectId);
    if(!config){
      throw new NotFoundException("Dashboard configuration not found");
    }
  }

  private async verifyThresholdOwnership(threshold: EvalThresholdEntity, projectId: number, configId: number): Promise<void> {
    if(threshold.dashboardConfigurationId){
      if(threshold.dashboardConfigurationId !== configId){
        throw new NotFoundException("Threshold not found");
      }
    } else if(threshold.testCaseId){
      await this.evalTestCaseRepository.verifyOwnership(threshold.testCaseId, projectId, configId);
    }
  }

  private async getSiblings(threshold: EvalThresholdEntity): Promise<EvalThresholdEntity[]> {
    if(threshold.testCaseId){
      return this.evalThresholdRepository.getAllByTestCaseId(threshold.testCaseId);
    }
    return this.evalThresholdRepository.getAllByConfigId(threshold.dashboardConfigurationId!);
  }

  public async getAll(projectId: number, configId: number): Promise<{ testCases: EvalTestCaseThresholdEntity[], master: EvalThresholdEntity[] }>{
    await this.verifyConfigOwnership(configId, projectId);
    const [testCases, master] = await Promise.all([
      this.evalTestCaseRepository.getAllThresholdsByProjectId(projectId, configId),
      this.evalThresholdRepository.getAllByConfigId(configId),
    ]);
    return { testCases, master };
  }

  public async create(projectId: number, configId: number, testCaseId: string | undefined, data: EvalThresholdCreateOrUpdateDto): Promise<EvalThresholdEntity>{
    if(data.value <= 0 || data.value >= 1){
      throw new BadRequestException("Threshold value can't be 0 or higher than or equal to 1")
    }

    if(testCaseId){
      await this.evalTestCaseRepository.verifyOwnership(testCaseId, projectId, configId);
      return this.evalThresholdRepository.create({ testCaseId, ...data });
    } else {
      await this.verifyConfigOwnership(configId, projectId);
      return this.evalThresholdRepository.create({ dashboardConfigurationId: configId, ...data });
    }
  }

  public async update(projectId: number, configId: number, thresholdId: string, data: EvalThresholdCreateOrUpdateDto): Promise<EvalThresholdEntity>{
    const threshold = await this.evalThresholdRepository.getByIdOrThrow(thresholdId);
    await this.verifyThresholdOwnership(threshold, projectId, configId);

    const siblings = await this.getSiblings(threshold);
    const duplicateValue = siblings.find((t) => t.value === data.value && t.id !== thresholdId);

    if(duplicateValue){
      throw new ConflictException("Threshold with this value already exists")
    }

    if(threshold.value === 1 && data.value !== 1){
      throw new BadRequestException("You can't update the last threshold's value")
    }

    return this.evalThresholdRepository.updateById(thresholdId, data);
  }

  public async delete(projectId: number, configId: number, thresholdId: string): Promise<void>{
    const threshold = await this.evalThresholdRepository.getByIdOrThrow(thresholdId);
    await this.verifyThresholdOwnership(threshold, projectId, configId);

    if(threshold.value === 1){
      throw new BadRequestException("You can't delete the last threshold")
    }

    await this.evalThresholdRepository.deleteById(thresholdId);
  }
}
