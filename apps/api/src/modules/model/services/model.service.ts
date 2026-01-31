import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ModelRepository } from "../../../repository/services/model-repository.service";
import { ModelEntity } from "../entity/model.entity";
import { ModelOutputEntity } from "../entity/model-output.entity";
import { ModelOutputRepository } from "../../../repository/services/model-output-repository.service";
import { ModelCreateRequest, ModelUpdateRequest } from "../dto/model.dto";
import { ModelStatusEnum } from "@repo/schema";
import { ProjectLabelRepository } from "../../../repository/services/project-label-repository.service";
import { DB_CONNECTION } from "../../../core/database/database.constant";
import type { DbConnection } from "../../../core/database/types/database.types";
import { modelLabelTable } from "@repo/database";
import { eq } from "drizzle-orm";

@Injectable()
export class ModelService{
  constructor(
    @Inject(DB_CONNECTION) private readonly db: DbConnection,
    private readonly modelRepository: ModelRepository,
    private readonly modelOutputRepository: ModelOutputRepository,
    private readonly projectLabelRepository: ProjectLabelRepository,
  ) {}


  /**
   * Get models
   * @param projectId - project id
   * @returns ModelEntity[]
   */
  public async getModels(projectId: number): Promise<ModelEntity[]>{
    return this.modelRepository.getAllByProjectId(projectId)
  }

  /**
   * Get model by ID
   * @param id - model id
   * @param projectId
   * @throws NotFoundException - Model not found
   * @returns ModelEntity
   */
  public async getModelById(id: number, projectId: number): Promise<ModelEntity>{
    const model = await this.modelRepository.getByIdAndProjectId(id, projectId);

    if(!model){
      throw new NotFoundException("Model not found")
    }

    return model
  }

  /**
   * Get model outputs
   * @param id - model ID
   * @param projectId
   * @throws NotFoundException - Model not found
   * @returns ModelOutputEntity[]
   */
  public async getModelOutputs(id: number, projectId: number): Promise<ModelOutputEntity[]>{
    await this.getModelById(id, projectId); // Access check

    return this.modelOutputRepository.getAllByModelId(id)
  }


  /**
   * Create model with labels
   * @param projectId
   * @param data - ModelCreateRequest
   * @returns ModelEntity
   */
  public async createModel(projectId: number, data: ModelCreateRequest): Promise<ModelEntity>{
    const labels = await this.getValidLabels(projectId, data.labelIds)

    const createdModel = await this.modelRepository.create({
      name: data.name,
      epochs: data.epochs,
      status: ModelStatusEnum.DRAFT,
      projectId,
      splitTrain: data.splitTrain,
      splitValidate: data.splitValidate,
      splitTest: data.splitTest,
    })

    await this.db.insert(modelLabelTable).values(labels.map((labelId) => ({
      modelId: createdModel.id,
      labelId
    })))

    return this.getModelById(createdModel.id, projectId)
  }


  /**
   * Update model
   * @param id
   * @param projectId
   * @param data - ModelUpdateRequest
   * @returns Updated ModelEntity
   */
  public async updateModel(id: number, projectId: number, data: ModelUpdateRequest): Promise<ModelEntity>{
    const model = await this.getModelById(id, projectId)

    if(model.status !== ModelStatusEnum.DRAFT){
      throw new BadRequestException("Cannot update model that is done or training")
    }

    const labels = await this.getValidLabels(projectId, data.labelIds)

    await this.modelRepository.update(model.id, {
      name: data.name,
      epochs: data.epochs,
      splitTrain: data.splitTrain,
      splitValidate: data.splitValidate,
      splitTest: data.splitTest,
      status: ModelStatusEnum.DRAFT
    })

    await this.db.transaction(async(tx) => {
      await tx.delete(modelLabelTable).where(eq(modelLabelTable.modelId, model.id))
      await tx.insert(modelLabelTable).values(labels.map((labelId) => ({
        modelId: model.id,
        labelId
      })))
    })

    return this.getModelById(model.id, projectId)
  }

  /**
   * Delete model
   * @param id - model id
   * @param projectId
   */
  public async deleteModel(id: number, projectId: number): Promise<void>{
    await this.getModelById(id, projectId);
    await this.modelRepository.delete(id)
  }


  /**
   * Get valid labels from label Ids by project
   * @param projectId
   * @param labelIds
   * @returns valid label IDs
   */
  private async getValidLabels(projectId: number, labelIds: number[]): Promise<number[]>{
    const labels =
      await this.projectLabelRepository.getAllByProjectId(projectId);
    const filteredLabels = labels.filter((label) =>
      labelIds.includes(label.id),
    );
    return filteredLabels.map((label) => label.id)
  }
}
