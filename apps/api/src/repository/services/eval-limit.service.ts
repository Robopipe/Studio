import { Inject, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { DB_CONNECTION } from "src/core/database/database.constant";
import type { DbConnection } from "src/core/database/types/database.types";
import { EvalLimitDetailEntity, EvalLimitEntity } from "src/modules/eval/entities/eval-limit.entity";
import { EvalLimitDetailSelect, EvalLimitInsert, EvalLimitSelect } from "../types/eval";
import { evalLimitTable } from "@repo/database";
import { and, asc, eq } from "drizzle-orm";

@Injectable()
export class EvalLimitRepository {
  constructor(@Inject(DB_CONNECTION) private readonly db: DbConnection){}

  /**
   * Get all limits by test case ID
   * @param testCaseId
   */
  public async getAllByTestCaseId(testCaseId: string): Promise<EvalLimitEntity[]>{
    const limits = await this.db.query.evalLimitTable.findMany({
      where: {
        testCaseId
      },
      with: {
        targetLabel: true,
        targetParentLabel: true
      },
      orderBy: (limit) => asc(limit.createdAt)
    })

    return limits.map((limit) => new EvalLimitEntity(limit as EvalLimitSelect))
  }

  /**
   * Get all limits with their items by test case ID
   * @param testCaseId
   */
  public async getAllDetailByTestCaseId(testCaseId: string): Promise<EvalLimitDetailEntity[]>{
    const limits = await this.db.query.evalLimitTable.findMany({
      where: {
        testCaseId
      },
      with: {
        targetLabel: true,
        targetParentLabel: true,
        limitItems: {
          orderBy: (limitItem) => asc(limitItem.position)
        }
      },
      orderBy: (limit) => asc(limit.createdAt)
    })

    return limits.map((limit) => new EvalLimitDetailEntity(limit as EvalLimitDetailSelect))
  }

  /**
   * Get by id and test case id
   * @param id
   * @param testCaseId
   * @returns EvalLimitDetailEntity or null if not found
   */
  public async getByIdAndTestCaseId(id: string, testCaseId: string): Promise<EvalLimitDetailEntity | null>{
    const limit = await this.db.query.evalLimitTable.findFirst({
      where: {
        id,
        testCaseId
      },
      with: {
        targetLabel: true,
        targetParentLabel: true,
        limitItems: {
          orderBy: (limitItem) => asc(limitItem.createdAt)
        }
      }
    })

    return limit ? new EvalLimitDetailEntity(limit as EvalLimitDetailSelect) : null;
  }

  /**
   * Get by id and test case id or throw
   * @param id
   * @param testCaseId
   * @throws NotFoundException - Limit not found
   * @returns EvalLimitDetailEntity
   */
  public async getByIdAndTestCaseIdOrThrow(id: string, testCaseId: string): Promise<EvalLimitDetailEntity>{
    const limit = await this.getByIdAndTestCaseId(id, testCaseId);
    if(!limit){
      throw new NotFoundException("Limit not found")
    }

    return limit
  }

  /**
   * Create limit
   * @param testCaseId
   * @param data - EvalLimitInsert
   * @param idOverride - Override SQL default uuid
   * @throws InternalServerErrorException - Failed creating limit
   * @throws NotFoundException - Limit not found
   * @returns EvalLimitDetailEntity
   */
  public async create(testCaseId: string, data: EvalLimitInsert, idOverride?: string): Promise<EvalLimitDetailEntity> {
    const [createdLimitId] = await this.db.insert(evalLimitTable).values({
      ...data,
      id: idOverride,
      testCaseId,
    }).returning({id: evalLimitTable.id})

    if(!createdLimitId){
      throw new InternalServerErrorException("Failed creating limit")
    }

    return this.getByIdAndTestCaseIdOrThrow(createdLimitId.id, testCaseId)
  }


  /**
   * Update limit
   * @param id
   * @param testCaseId
   * @param data - EvalLimitInsert
   * @throws InternalServerErrorException - Failed updating limit
   * @throws NotFoundException - Limit not found
   * @returns EvalLimitDetailEntity
   */
  public async update(id: string, testCaseId: string, data: EvalLimitInsert): Promise<EvalLimitDetailEntity>{
    const [updatedLimitId] = await this.db.update(evalLimitTable)
      .set(data)
      .where(
        and(
          eq(evalLimitTable.testCaseId, testCaseId),
          eq(evalLimitTable.id, id)
        )
      ).returning({id: evalLimitTable.id})

    if(!updatedLimitId){
      throw new InternalServerErrorException("Failed updating limit")
    }

    return this.getByIdAndTestCaseIdOrThrow(id, testCaseId)
  }


  /**
   * Delete limit by id and test case id
   * @param id
   * @param testCaseId
   */
  public async delete(id: string, testCaseId: string): Promise<void>{
    await this.db.delete(evalLimitTable).where(
      and(
        eq(evalLimitTable.testCaseId, testCaseId),
        eq(evalLimitTable.id, id)
      )
    )
  }
}
