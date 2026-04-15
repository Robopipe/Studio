import { Inject, Injectable } from "@nestjs/common";
import { DB_CONNECTION } from "../../core/database/database.constant";
import type { DbConnection } from "../../core/database/types/database.types";
import { ModelLogEntity } from "../../modules/model/entity/model-log.entity";
import { ModelLogInsert } from "../types/model-log";
import { modelLogTable } from "@repo/database";
import { asc, desc } from "drizzle-orm";

@Injectable()
export class ModelLogRepository {
  constructor(@Inject(DB_CONNECTION) private readonly db: DbConnection) {}

  /**
   * Get all logs by model ID
   * @param id
   * @returns ModelLogEntity[]
   */
  public async getAllByModelId(id: number): Promise<ModelLogEntity[]>{
    const logs = await this.db.query.modelLogTable.findMany({
      where: {
        modelId: id
      },
      orderBy: (log) => asc(log.createdAt)
    })

    return logs.map((log) => new ModelLogEntity(log))
  }

  /**
   * Create model log
   * @param data - ModelLogInsert
   */
  public async create(data: ModelLogInsert): Promise<void>{
    await this.db.insert(modelLogTable).values(data)
  }

  /**
   * Get the latest log (by epoch) for a model, or null if none exist
   */
  public async getLatestByModelId(id: number): Promise<ModelLogEntity | null>{
    const log = await this.db.query.modelLogTable.findFirst({
      where: { modelId: id },
      orderBy: (l) => desc(l.epoch),
    })
    return log ? new ModelLogEntity(log) : null
  }
}
