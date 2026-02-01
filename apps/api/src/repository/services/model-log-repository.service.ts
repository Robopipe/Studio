import { Inject, Injectable } from "@nestjs/common";
import { DB_CONNECTION } from "../../core/database/database.constant";
import type { DbConnection } from "../../core/database/types/database.types";
import { ModelLogEntity } from "../../modules/model/entity/model-log.entity";
import { ModelLogInsert } from "../types/model-log";
import { modelLogTable } from "@repo/database";

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
      }
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
}
