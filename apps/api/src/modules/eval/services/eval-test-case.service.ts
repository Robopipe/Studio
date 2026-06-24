import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { EvalTestCaseDetailEntity, EvalTestCaseEntity } from "../entities/eval-test-case.entity";
import { EvalLimitDetailEntity } from "../entities/eval-limit.entity";
import { EvalTestCaseCreateOrUpdateDto, EvalTestCaseFullCreateOrUpdateDto } from "../dto/eval-test-case.dto";
import { EvalTestCaseRepository } from "src/repository/services/eval-test-case.service";
import { EvalThresholdRepository } from "src/repository/services/eval-threshold.service";
import { DashboardConfigurationRepository } from "src/repository/services/dashboard-configuration.service";
import { defaultThresholds } from "../data/eval-threshold.data";
import { NotFoundException } from "@nestjs/common";
import { EvalLimitRepository } from "src/repository/services/eval-limit.service";
import { ProjectLabelRepository } from "src/repository/services/project-label-repository.service";
import { DB_CONNECTION } from "src/core/database/database.constant";
import { type DbConnection } from "src/core/database/types/database.types";
import { evalLimitItemTable } from "@repo/database";
import { and, eq, inArray } from "drizzle-orm";

@Injectable()
export class EvalTestCaseService {
  constructor(
    private readonly evalTestCaseRepository: EvalTestCaseRepository,
    private readonly evalThresholdRepository: EvalThresholdRepository,
    private readonly evalLimitRepository: EvalLimitRepository,
    private readonly dashboardConfigurationRepository: DashboardConfigurationRepository,
    private readonly projectLabelRepository: ProjectLabelRepository,
    @Inject(DB_CONNECTION) private readonly db: DbConnection
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

  private async verifyTestCaseFullLabelOwnership(projectId: number, data: EvalTestCaseFullCreateOrUpdateDto): Promise<void>{
    const projectLabels = await this.projectLabelRepository.getAllByProjectId(projectId)
    const projectLabelIds = new Set([...projectLabels.map((projectLabel) => projectLabel.id)])

    const limitLabelIds = (data.limits || []).reduce((acc: Set<number>, current) => {
      acc.add(current.targetLabelId)
      if(current.targetParentLabelId){
        acc.add(current.targetParentLabelId)
      }

      return acc
    }, new Set<number>())

    for(const labelId of limitLabelIds){
      if(!projectLabelIds.has(labelId)){
        throw new BadRequestException(`Label ID ${labelId} not found in project`)
      }
    }
  }

  public async createTestCaseFull(projectId: number, configId: number, data: EvalTestCaseFullCreateOrUpdateDto): Promise<EvalTestCaseDetailEntity>{
    await this.verifyConfigOwnership(configId, projectId)
    await this.verifyTestCaseFullLabelOwnership(projectId, data)

    const createdTestCase = await this.evalTestCaseRepository.create(projectId, configId, {
      logicNodes: data.logicNodes ?? [],
      name: data.name,
      type: data.type,
      severity: data.severity,
      enabled: data.enabled,
    })

    await this.evalThresholdRepository.createManyForTestCase(createdTestCase.id, defaultThresholds)

    for (const limit of (data.limits || [])){
      const createdLimit = await this.evalLimitRepository.create(createdTestCase.id, {
        name: limit.name, severity: limit.severity,
        targetParentLabelId: limit.targetParentLabelId, targetLabelId: limit.targetLabelId
      }, limit.id ?? undefined);

      if(limit.limitItems.length){
        await this.db.insert(evalLimitItemTable).values(limit.limitItems.map((limitItem, index) => ({
          id: limitItem.id ?? undefined,
          limitId: createdLimit.id,
          limitFrom: limitItem.limitFrom,
          limitTo: limitItem.limitTo,
          parameter: limitItem.parameter,
          operator: limitItem.operator,
          quantifierType: limitItem.quantifierType,
          quantifierUnit: limitItem.quantifierUnit,
          quantifierValue: limitItem.quantifierValue,
          targetEdge: limitItem.targetEdge,
          parentEdge: limitItem.parentEdge,
          position: index
        })))
      }

    }

    return this.getTestCaseDetail(projectId, configId, createdTestCase.id)
  }

  public async updateTestCaseFull(
    projectId: number,
    configId: number,
    testCaseId: string,
    data: EvalTestCaseFullCreateOrUpdateDto
  ): Promise<EvalTestCaseDetailEntity>{
    const existingTestCase = await this.evalTestCaseRepository.getDetailOrThrow(testCaseId, projectId, configId)
    await this.verifyTestCaseFullLabelOwnership(projectId, data)

    await this.evalTestCaseRepository.update(testCaseId, projectId, {
      name: data.name,
      type: data.type,
      severity: data.severity,
      enabled: data.enabled,
      logicNodes: data.logicNodes ?? existingTestCase.logicNodes,
    })

    const existingLimits = await this.evalLimitRepository.getAllDetailByTestCaseId(testCaseId)
    const existingLimitMap = new Map(existingLimits.map((l) => [l.id, l]))
    const requestLimits = data.limits ?? []
    const requestLimitIds = new Set(
      requestLimits.filter((l): l is typeof l & { id: string } => l.id != null).map((l) => l.id)
    )

    const limitIdsToDelete = existingLimits
      .filter((l) => !requestLimitIds.has(l.id))
      .map((l) => l.id)
    for (const limitId of limitIdsToDelete) {
      await this.evalLimitRepository.delete(limitId, testCaseId)
    }

    for (const limit of requestLimits) {
      const limitData = {
        name: limit.name,
        severity: limit.severity,
        targetLabelId: limit.targetLabelId,
        targetParentLabelId: limit.targetParentLabelId,
      }
      const existingLimit = limit.id != null ? existingLimitMap.get(limit.id) : undefined

      let limitId: string
      if (existingLimit) {
        const updated = await this.evalLimitRepository.update(existingLimit.id, testCaseId, limitData)
        limitId = updated.id
      } else {
        const created = await this.evalLimitRepository.create(testCaseId, limitData, limit.id ?? undefined)
        limitId = created.id
      }

      await this.diffLimitItems(limitId, existingLimit?.limitItems ?? [], limit.limitItems)
    }

    return this.getTestCaseDetail(projectId, configId, testCaseId)
  }

  private async diffLimitItems(
    limitId: string,
    existingItems: EvalLimitDetailEntity["limitItems"],
    requestItems: NonNullable<EvalTestCaseFullCreateOrUpdateDto["limits"]>[number]["limitItems"]
  ): Promise<void> {
    const existingItemIds = new Set(existingItems.map((item) => item.id))
    const requestItemIds = new Set(
      requestItems.filter((item): item is typeof item & { id: string } => item.id != null).map((item) => item.id)
    )

    const idsToDelete = existingItems
      .filter((item) => !requestItemIds.has(item.id))
      .map((item) => item.id)
    const itemsToUpdate = requestItems
      .map((item, index) => ({ ...item, index }))
      .filter((item): item is typeof item & { id: string } => item.id != null && existingItemIds.has(item.id))
    const itemsToInsert = requestItems
      .map((item, index) => ({ ...item, index }))
      .filter((item) => item.id == null || !existingItemIds.has(item.id))

    if (idsToDelete.length) {
      await this.db.delete(evalLimitItemTable).where(
        and(inArray(evalLimitItemTable.id, idsToDelete), eq(evalLimitItemTable.limitId, limitId))
      )
    }

    await Promise.all(itemsToUpdate.map((item) =>
      this.db.update(evalLimitItemTable)
        .set({
          limitFrom: item.limitFrom,
          limitTo: item.limitTo,
          parameter: item.parameter,
          operator: item.operator,
          position: item.index,
          quantifierType: item.quantifierType,
          quantifierUnit: item.quantifierUnit,
          quantifierValue: item.quantifierValue,
          targetEdge: item.targetEdge,
          parentEdge: item.parentEdge,
        })
        .where(and(eq(evalLimitItemTable.id, item.id), eq(evalLimitItemTable.limitId, limitId)))
    ))

    if (itemsToInsert.length) {
      await this.db.insert(evalLimitItemTable).values(
        itemsToInsert.map((item) => ({
          id: item.id ?? undefined,
          limitId,
          limitFrom: item.limitFrom,
          limitTo: item.limitTo,
          parameter: item.parameter,
          operator: item.operator,
          position: item.index,
          quantifierType: item.quantifierType,
          quantifierUnit: item.quantifierUnit,
          quantifierValue: item.quantifierValue,
          targetEdge: item.targetEdge,
          parentEdge: item.parentEdge,
        }))
      )
    }
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
