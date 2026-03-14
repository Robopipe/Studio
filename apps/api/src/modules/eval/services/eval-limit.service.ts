import { Inject, Injectable } from "@nestjs/common";
import { EvalLimitRepository } from "src/repository/services/eval-limit.service";
import { EvalLimitDetailEntity, EvalLimitEntity } from "../entities/eval-limit.entity";
import { EvalTestCaseRepository } from "src/repository/services/eval-test-case.service";
import { EvalLimitCreateOrUpdateDto } from "../dto/eval-limit.dto";
import { DB_CONNECTION } from "src/core/database/database.constant";
import type { DbConnection } from "src/core/database/types/database.types";
import { evalLimitItemTable } from "@repo/database";
import { eq, inArray } from "drizzle-orm";

@Injectable()
export class EvalLimitService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: DbConnection,
    private readonly evalLimitRepository: EvalLimitRepository,
    private readonly evalTestCaseRepository: EvalTestCaseRepository
  ){}

  /**
   * Get eval limits for test case
   * @param projectId
   * @param testCaseId
   * @throws NotFoundException - Test case not found
   * @returns EvalLimitEntity[]
   */
  public async getTestCaseLimits(projectId: number, testCaseId: string): Promise<EvalLimitEntity[]>{
    await this.evalTestCaseRepository.getByIdAndProjectIdOrThrow(testCaseId, projectId)
    return this.evalLimitRepository.getAllByTestCaseId(testCaseId)
  }


  /**
   * Get eval limit detail
   * @param projectId
   * @param testCaseId
   * @param limitId
   * @throws NotFoundException - Test case not found
   * @throws NotFoundException - Limit not found
   * @returns EvalLimitDetailEntity
   */
  public async getLimitDetail(projectId: number, testCaseId: string, limitId: string): Promise<EvalLimitDetailEntity>{
    await this.evalTestCaseRepository.getByIdAndProjectIdOrThrow(testCaseId, projectId)
    return this.evalLimitRepository.getByIdAndTestCaseIdOrThrow(limitId, testCaseId)
  }


  /**
   * Create limit
   * @param projectId
   * @param testCaseId
   * @param data - EvalLimitCreateOrUpdateDto
   * @returns EvalLimitDetailEntity
   */
  public async createLimit(projectId: number, testCaseId: string, data: EvalLimitCreateOrUpdateDto): Promise<EvalLimitDetailEntity>{
    await this.evalTestCaseRepository.getByIdAndProjectIdOrThrow(testCaseId, projectId)
    const createdLimit = await this.evalLimitRepository.create(testCaseId, data)

    if(data.limitItems.length){
      await this.db.insert(evalLimitItemTable)
        .values(
          data.limitItems.map((limitItem, index) => ({
            limitId: createdLimit.id,
            limitFrom: limitItem.limitFrom,
            limitTo: limitItem.limitTo,
            parameter: limitItem.parameter,
            operator: limitItem.operator,
            position: index
        })))
    }

    return this.evalLimitRepository.getByIdAndTestCaseIdOrThrow(createdLimit.id, testCaseId)
  }

  public async updateLimit(projectId: number, testCaseId: string, limitId: string, data: EvalLimitCreateOrUpdateDto): Promise<EvalLimitDetailEntity> {
    await this.evalTestCaseRepository.getByIdAndProjectIdOrThrow(testCaseId, projectId)
    const existingLimit = await this.evalLimitRepository.getByIdAndTestCaseIdOrThrow(limitId, testCaseId)

    const { limitItems, ...limitData } = data
    await this.evalLimitRepository.update(limitId, testCaseId, limitData)
    await this.diffLimitItems(limitId, existingLimit.limitItems, limitItems)

    return this.evalLimitRepository.getByIdAndTestCaseIdOrThrow(limitId, testCaseId)
  }

  /**
   * Diff limit items — delete removed, update existing, insert new
   */
  private async diffLimitItems(
    limitId: string,
    existingItems: EvalLimitDetailEntity["limitItems"],
    requestItems: EvalLimitCreateOrUpdateDto["limitItems"]
  ): Promise<void>{
    const existingItemIds = new Set(existingItems.map((item) => item.id))
    const requestItemIds = new Set(requestItems.filter((item) => item.id !== null).map((item) => item.id as string))

    const idsToDelete = existingItems.filter((item) => !requestItemIds.has(item.id)).map((item) => item.id)
    const itemsToUpdate = requestItems
      .map((item, index) => ({ ...item, index }))
      .filter((item): item is typeof item & { id: string } => item.id !== null && existingItemIds.has(item.id!))
    const itemsToInsert = requestItems
      .map((item, index) => ({ ...item, index }))
      .filter((item) => item.id === null)

    // Delete removed items
    if(idsToDelete.length > 0){
      await this.db.delete(evalLimitItemTable).where(inArray(evalLimitItemTable.id, idsToDelete))
    }

    // Update existing items
    await Promise.all(itemsToUpdate.map((item) =>
      this.db.update(evalLimitItemTable)
        .set({
          limitFrom: item.limitFrom,
          limitTo: item.limitTo,
          parameter: item.parameter,
          operator: item.operator,
          position: item.index,
        })
        .where(eq(evalLimitItemTable.id, item.id))
    ))

    // Insert new items
    if(itemsToInsert.length > 0){
      await this.db.insert(evalLimitItemTable).values(
        itemsToInsert.map((item) => ({
          limitFrom: item.limitFrom,
          limitTo: item.limitTo,
          parameter: item.parameter,
          operator: item.operator,
          position: item.index,
          limitId,
        }))
      )
    }
  }

  /**
   * Delete limit
   * @param projectId
   * @param testCaseId
   * @param limitId
   * @throws NotFoundException - Test case not found
   */
  public async deleteLimit(projectId: number, testCaseId: string, limitId: string): Promise<void>{
    await this.evalTestCaseRepository.getByIdAndProjectIdOrThrow(testCaseId, projectId)
    await this.evalLimitRepository.delete(limitId, testCaseId)
  }
}
