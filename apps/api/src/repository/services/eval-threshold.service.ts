import { Inject, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { DB_CONNECTION } from "src/core/database/database.constant";
import type { DbConnection } from "src/core/database/types/database.types";
import { EvalThresholdInsert } from "../types/eval";
import { evalThresholdTable } from "@repo/database";
import { EvalThresholdEntity } from "src/modules/eval/entities/eval-threshold.entity";
import { and, asc, eq } from "drizzle-orm";

@Injectable()
export class EvalThresholdRepository {
  constructor(@Inject(DB_CONNECTION) private readonly db: DbConnection){}

  /**
   * Get by id and test case id
   * @param id
   * @param testCaseId
   * @returns  EvalThresholdEntity or null if not found
   */
  public async getByIdAndTestCaseId(id: string, testCaseId: string): Promise<EvalThresholdEntity | null>{
    const [foundThreshold] = await this.db.select()
      .from(evalThresholdTable)
      .where(
        and(
          eq(evalThresholdTable.id, id),
          eq(evalThresholdTable.testCaseId, testCaseId)
        )
      );

    return foundThreshold ? new EvalThresholdEntity(foundThreshold) : null;
  }

  /**
   * Get by id and test case id or throw
   * @param id
   * @param testCaseId
   * @throws
   * @returns EvalThresholdEntity
   */
  public async getByIdAndTestCaseIdOrThrow(id: string, testCaseId: string): Promise<EvalThresholdEntity> {
    const foundThreshold = await this.getByIdAndTestCaseId(id, testCaseId);
    if(!foundThreshold){
      throw new NotFoundException("Threshold not found")
    }

    return foundThreshold
  }

  /**
   * Get all by test case id
   * @param testCaseId
   * @returns EvalThresholdEntity[]
   */
  public async getAllByTestCaseId(testCaseId: string): Promise<EvalThresholdEntity[]>{
    const foundThresholds = await this.db.query.evalThresholdTable.findMany({
      where: {
        testCaseId
      },
      orderBy: (threshold) => asc(threshold.value)
    })

    return foundThresholds.map((threshold) => new EvalThresholdEntity(threshold))
  }


  /**
   * Create threshold
   * @param testCaseId
   * @param data - EvalThresholdInsert
   * @throws InternalServerErrorException - Failed creating threshold
   * @returns EvalThresholdEntity
   */
  public async create(testCaseId: string, data: EvalThresholdInsert): Promise<EvalThresholdEntity>{
    const [createdThreshold] = await this.db.insert(evalThresholdTable).values({
      testCaseId,
      ...data
    }).returning()

    if(!createdThreshold){
      throw new InternalServerErrorException("Failed creating threshold")
    }

    return new EvalThresholdEntity(createdThreshold)
  }

  /**
   * Create many
   * @param testCaseId
   * @param data - EvalThresholdInsert[]
   */
  public async createMany(testCaseId: string, data: EvalThresholdInsert[]): Promise<void>{
    await this.db.insert(evalThresholdTable).values(data.map((threshold) => ({
      testCaseId,
      ...threshold
    })))
  }

  /**
   * Update threshold
   * @param id
   * @param testCaseId
   * @param data - EvalThresholdInsert
   * @returns EvalThresholdEntity
   */
  public async update(id: string, testCaseId: string, data: EvalThresholdInsert): Promise<EvalThresholdEntity>{
    const [updatedThreshold] = await this.db.update(evalThresholdTable)
      .set(data)
      .where(
        and(
          eq(evalThresholdTable.id, id),
          eq(evalThresholdTable.testCaseId, testCaseId)
        )
      ).returning()

    if(!updatedThreshold){
      throw new InternalServerErrorException("Failed updating threshold")
    }

    return new EvalThresholdEntity(updatedThreshold)
  }

  /**
   * Delete threshold
   * @param id
   * @param testCaseId
   */
  public async delete(id: string, testCaseId: string): Promise<void> {
    await this.db.delete(evalThresholdTable).where(
      and(
        eq(evalThresholdTable.id, id),
        eq(evalThresholdTable.testCaseId, testCaseId)
      )
    )
  }
}
