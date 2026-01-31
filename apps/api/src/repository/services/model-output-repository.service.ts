import { Inject, Injectable, InternalServerErrorException } from "@nestjs/common";
import { DB_CONNECTION } from "../../core/database/database.constant";
import type { DbConnection } from "../../core/database/types/database.types";
import { ModelOutputEntity } from "../../modules/model/entity/model-output.entity";
import { ModelOutputInsert } from "../types/model-output";
import { modelOutputTable } from "@repo/database";

@Injectable()
export class ModelOutputRepository {
  constructor(@Inject(DB_CONNECTION) private readonly db: DbConnection) {}

  /**
   * Get model outputs by model id
   * @param modelId
   * @returns ModelOutputEntity[]
   */
  public async getAllByModelId(modelId: number): Promise<ModelOutputEntity[]>{
    const modelOutputs = await this.db.query.modelOutputTable.findMany({
      where: {
        modelId
      }
    })

    return modelOutputs.map((modelOutput) => new ModelOutputEntity(modelOutput))
  }


  /**
   * Create model output
   * @param data - ModelOutput Insert
   * @throws InternalServerErrorException - Failed creating model output
   * @returns ModelOutputEntity
   */
  public async create(data: ModelOutputInsert): Promise<ModelOutputEntity>{
    const [createdModelOutput] = await this.db.insert(modelOutputTable).values(data).returning();
    if(!createdModelOutput){
      throw new InternalServerErrorException("Failed creating model output")
    }

    return new ModelOutputEntity(createdModelOutput)
  }
}
