import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { EvalLimitRepository } from "src/repository/services/eval-limit.service";
import { EvalLimitDetailEntity, EvalLimitEntity } from "../entities/eval-limit.entity";
import { EvalTestCaseRepository } from "src/repository/services/eval-test-case.service";
import { EvalLimitCreateOrUpdateDto } from "../dto/eval-limit.dto";
import { DB_CONNECTION } from "src/core/database/database.constant";
import type { DbConnection } from "src/core/database/types/database.types";
import { evalLimitItemTable } from "@repo/database";
import { and, eq, inArray } from "drizzle-orm";
import { ProjectLabelRepository } from "src/repository/services/project-label-repository.service";
import type { EvalLogicNode, EvalLogicNodeTypeEnum } from "@repo/schema";

@Injectable()
export class EvalLimitService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: DbConnection,
    private readonly evalLimitRepository: EvalLimitRepository,
    private readonly evalTestCaseRepository: EvalTestCaseRepository,
    private readonly projectLabelRepository: ProjectLabelRepository,
  ){}

  /**
   * Get eval limits for test case.
   * Single lightweight query verifies project + config + test case ownership.
   */
  public async getTestCaseLimits(projectId: number, configId: number, testCaseId: string): Promise<EvalLimitEntity[]>{
    await this.evalTestCaseRepository.verifyOwnership(testCaseId, projectId, configId);
    return this.evalLimitRepository.getAllByTestCaseId(testCaseId)
  }

  /**
   * Get eval limit detail.
   */
  public async getLimitDetail(projectId: number, configId: number, testCaseId: string, limitId: string): Promise<EvalLimitDetailEntity>{
    await this.evalTestCaseRepository.verifyOwnership(testCaseId, projectId, configId);
    return this.evalLimitRepository.getByIdAndTestCaseIdOrThrow(limitId, testCaseId)
  }

  /**
   * Create limit.
   */
  public async createLimit(projectId: number, configId: number, testCaseId: string, data: EvalLimitCreateOrUpdateDto): Promise<EvalLimitDetailEntity>{
    await this.evalTestCaseRepository.verifyOwnership(testCaseId, projectId, configId);
    await this.validateLabelsInProject(data, projectId)
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
            quantifierType: limitItem.quantifierType,
            quantifierUnit: limitItem.quantifierUnit,
            quantifierValue: limitItem.quantifierValue,
            position: index
        })))
    }

    return this.evalLimitRepository.getByIdAndTestCaseIdOrThrow(createdLimit.id, testCaseId)
  }

  /**
   * Update limit.
   */
  public async updateLimit(projectId: number, configId: number, testCaseId: string, limitId: string, data: EvalLimitCreateOrUpdateDto): Promise<EvalLimitDetailEntity> {
    await this.evalTestCaseRepository.verifyOwnership(testCaseId, projectId, configId);
    await this.validateLabelsInProject(data, projectId)
    const existingLimit = await this.evalLimitRepository.getByIdAndTestCaseIdOrThrow(limitId, testCaseId)

    const { limitItems, ...limitData } = data
    await this.evalLimitRepository.update(limitId, testCaseId, limitData)
    await this.diffLimitItems(limitId, existingLimit.limitItems, limitItems)

    return this.evalLimitRepository.getByIdAndTestCaseIdOrThrow(limitId, testCaseId)
  }

  /**
   * Validate that targetLabelId and targetParentLabelId belong to the project.
   */
  private async validateLabelsInProject(data: EvalLimitCreateOrUpdateDto, projectId: number): Promise<void>{
    const labelIds: number[] = [data.targetLabelId];
    if(data.targetParentLabelId){
      labelIds.push(data.targetParentLabelId)
    }
    const projectLabels = await this.projectLabelRepository.getAllByIdInAndProjectId(labelIds, projectId)
    const foundIds = projectLabels.map((l) => l.id)

    if(!foundIds.includes(data.targetLabelId)){
      throw new BadRequestException("Target label not found")
    }
    if(data.targetParentLabelId && !foundIds.includes(data.targetParentLabelId)){
      throw new BadRequestException("Target parent label not found")
    }
  }

  /**
   * Diff limit items — delete removed, update existing, insert new.
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
      await this.db.delete(evalLimitItemTable).where(and(inArray(evalLimitItemTable.id, idsToDelete), eq(evalLimitItemTable.limitId, limitId)))
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
          quantifierType: item.quantifierType,
          quantifierUnit: item.quantifierUnit,
          quantifierValue: item.quantifierValue,
        })
        .where(and(eq(evalLimitItemTable.id, item.id), eq(evalLimitItemTable.limitId, limitId)))
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
          quantifierType: item.quantifierType,
          quantifierUnit: item.quantifierUnit,
          quantifierValue: item.quantifierValue,
        }))
      )
    }
  }

  /**
   * Check if a limit ID is referenced in logic nodes (recursively).
   */
  private isLimitInLogicNodes(nodes: EvalLogicNode[], limitId: string): boolean {
    for (const node of nodes) {
      if (node.type === ("LIMIT" as EvalLogicNodeTypeEnum) && node.id === limitId) {
        return true;
      }
      if ("children" in node && this.isLimitInLogicNodes(node.children as EvalLogicNode[], limitId)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Delete limit. Returns { deleted: true } if deleted, { deleted: false } if limit is used in evaluation logic.
   */
  public async deleteLimit(projectId: number, configId: number, testCaseId: string, limitId: string): Promise<{ deleted: boolean }>{
    const logicNodes = await this.evalTestCaseRepository.getLogicNodes(testCaseId, projectId, configId);

    if (this.isLimitInLogicNodes(logicNodes, limitId)) {
      return { deleted: false };
    }

    await this.evalLimitRepository.delete(limitId, testCaseId)
    return { deleted: true };
  }
}
