import { Inject, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { DB_CONNECTION } from "src/core/database/database.constant";
import type { DbConnection } from "src/core/database/types/database.types";
import { EvalThresholdInsert } from "../types/eval";
import { evalThresholdTable } from "@repo/database";
import { EvalThresholdEntity } from "src/modules/eval/entities/eval-threshold.entity";
import { asc, eq } from "drizzle-orm";

@Injectable()
export class EvalThresholdRepository {
  constructor(@Inject(DB_CONNECTION) private readonly db: DbConnection){}

  public async getByIdOrThrow(id: string): Promise<EvalThresholdEntity>{
    const [found] = await this.db.select()
      .from(evalThresholdTable)
      .where(eq(evalThresholdTable.id, id));

    if(!found){
      throw new NotFoundException("Threshold not found")
    }

    return new EvalThresholdEntity(found);
  }

  public async getAllByTestCaseId(testCaseId: string): Promise<EvalThresholdEntity[]>{
    const found = await this.db.query.evalThresholdTable.findMany({
      where: { testCaseId },
      orderBy: (threshold) => asc(threshold.value)
    })

    return found.map((t) => new EvalThresholdEntity(t))
  }

  public async getAllByConfigId(configId: number): Promise<EvalThresholdEntity[]>{
    const found = await this.db.query.evalThresholdTable.findMany({
      where: { dashboardConfigurationId: configId },
      orderBy: (threshold) => asc(threshold.value)
    })

    return found.map((t) => new EvalThresholdEntity(t))
  }

  public async create(data: EvalThresholdInsert & { testCaseId?: string, dashboardConfigurationId?: number }): Promise<EvalThresholdEntity>{
    const [created] = await this.db.insert(evalThresholdTable).values(data).returning()

    if(!created){
      throw new InternalServerErrorException("Failed creating threshold")
    }

    return new EvalThresholdEntity(created)
  }

  public async createManyForTestCase(testCaseId: string, data: EvalThresholdInsert[]): Promise<void>{
    await this.db.insert(evalThresholdTable).values(data.map((t) => ({
      testCaseId,
      ...t
    })))
  }

  public async createManyForConfig(configId: number, data: EvalThresholdInsert[]): Promise<void>{
    await this.db.insert(evalThresholdTable).values(data.map((t) => ({
      dashboardConfigurationId: configId,
      ...t
    })))
  }

  public async updateById(id: string, data: EvalThresholdInsert): Promise<EvalThresholdEntity>{
    const [updated] = await this.db.update(evalThresholdTable)
      .set(data)
      .where(eq(evalThresholdTable.id, id))
      .returning()

    if(!updated){
      throw new InternalServerErrorException("Failed updating threshold")
    }

    return new EvalThresholdEntity(updated)
  }

  public async deleteById(id: string): Promise<void> {
    await this.db.delete(evalThresholdTable).where(eq(evalThresholdTable.id, id))
  }
}
