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
import { datasetTable, datasetVersionTable, datasetVersionTaskTable, modelAugmentationTable, modelLabelTable, modelPreprocessingTable } from "@repo/database";
import { eq } from "drizzle-orm";
import { ModelLogRepository } from "../../../repository/services/model-log-repository.service";
import { ModelLogEntity } from "../entity/model-log.entity";
import { TrainingExternalService } from "../../training-external/services/training-external.service";

@Injectable()
export class ModelService{
  constructor(
    @Inject(DB_CONNECTION) private readonly db: DbConnection,
    private readonly modelRepository: ModelRepository,
    private readonly modelOutputRepository: ModelOutputRepository,
    private readonly projectLabelRepository: ProjectLabelRepository,
    private readonly modelLogRepository: ModelLogRepository,
    private readonly trainingExternalService: TrainingExternalService
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
    await this.checkModelAccess(id, projectId)
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
      outputTypes: data.outputTypes,
      trainingType: data.trainingType,
      annotationsUsed: data.annotationsUsed,
      projectId,
      splitTrain: data.splitTrain,
      splitValidate: data.splitValidate,
      splitTest: data.splitTest,
      customHyperparams: data.customHyperparams,
    })

    await this.db.insert(modelLabelTable).values(labels.map((labelId) => ({
      modelId: createdModel.id,
      labelId
    })))

    if (data.taskIds && data.taskIds.length > 0) {
      const versionId = await this.getOrCreateDatasetVersion(
        projectId,
        `Dataset for ${data.name}`,
        data.taskIds,
        null,
      );
      await this.modelRepository.update(createdModel.id, { datasetVersionId: versionId });
    }

    if (data.augmentations.length > 0) {
      await this.db.insert(modelAugmentationTable).values(data.augmentations.map(aug => ({
        modelId: createdModel.id,
        type: aug.type,
        params: aug.params
      })))
    }

    if (data.preprocessings.length > 0) {
      await this.db.insert(modelPreprocessingTable).values(data.preprocessings.map(pp => ({
        modelId: createdModel.id,
        type: pp.type,
        params: pp.params,
        keepOriginal: pp.keepOriginal,
      })))
    }

    if (data.train) {
      await this.modelRepository.update(createdModel.id, {
        status: ModelStatusEnum.TRAINING,
      })

      const fullModel = await this.getModelById(createdModel.id, projectId)

      this.trainingExternalService.train(fullModel).catch(async (err) => {
        await this.modelRepository.update(createdModel.id, {
          status: ModelStatusEnum.ERROR,
          errorMessage: err instanceof Error ? err.message : String(err),
        })
      })

      return fullModel
    }

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
      outputTypes: data.outputTypes,
      trainingType: data.trainingType,
      annotationsUsed: data.annotationsUsed,
      splitTrain: data.splitTrain,
      splitValidate: data.splitValidate,
      splitTest: data.splitTest,
      customHyperparams: data.customHyperparams,
      status: ModelStatusEnum.DRAFT
    })

    await this.db.transaction(async(tx) => {
      await tx.delete(modelLabelTable).where(eq(modelLabelTable.modelId, model.id))
      await tx.insert(modelLabelTable).values(labels.map((labelId) => ({
        modelId: model.id,
        labelId
      })))
    })

    if (data.taskIds && data.taskIds.length > 0) {
      const rawModel = await this.db.query.modelTable.findFirst({ where: { id: model.id } });
      const versionId = await this.getOrCreateDatasetVersion(
        projectId,
        `Dataset for ${data.name}`,
        data.taskIds,
        rawModel?.datasetVersionId ?? null,
      );
      if (versionId !== rawModel?.datasetVersionId) {
        await this.modelRepository.update(model.id, { datasetVersionId: versionId });
      }
    }

    return this.getModelById(model.id, projectId)
  }

  /**
   * Get model logs
   * @param id
   * @param projectId
   * @retur ModelLogEntity[]
   */
  public async getModelLogs(id: number, projectId: number): Promise<ModelLogEntity[]>{
    await this.checkModelAccess(id, projectId)
    return this.modelLogRepository.getAllByModelId(id)
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
   * Train model
   * @param id - model ID
   * @param projectId
   */
  public async trainModel(id: number, projectId: number): Promise<ModelEntity>{
    const model = await this.getModelById(id, projectId)
    await this.trainingExternalService.train(model)
    return this.modelRepository.update(id, {
      status: ModelStatusEnum.TRAINING
    })
  }


  /**
   * Check model access
   * @param id
   * @param projectId
   * @throws NotFoundException - Model not found
   */
  private async checkModelAccess(id: number, projectId: number): Promise<void>{
    const hasAccess = await this.modelRepository.existsByIdAndProjectId(id, projectId);
    if(!hasAccess){
      throw new NotFoundException("Model not found")
    }
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

  /**
   * Get an existing dataset version whose task list matches, or append a new one.
   * - If existing version's task list matches → reuse (no-op)
   * - If existing version's task list differs → append new version under same dataset
   * - If no existing version → create new dataset + v1
   */
  private async getOrCreateDatasetVersion(
    projectId: number,
    fallbackDatasetName: string,
    taskIds: number[],
    existingDatasetVersionId: number | null,
  ): Promise<number> {
    if (existingDatasetVersionId) {
      const current = await this.db.query.datasetVersionTable.findFirst({
        where: { id: existingDatasetVersionId },
      });
      if (current) {
        const currentTasks = await this.db.query.datasetVersionTaskTable.findMany({
          where: { datasetVersionId: existingDatasetVersionId },
        });
        const currentSet = new Set(currentTasks.map((t) => t.taskId));
        const newSet = new Set(taskIds);
        const isSame =
          currentSet.size === newSet.size &&
          [...currentSet].every((id) => newSet.has(id));

        if (isSame) return existingDatasetVersionId;

        return this.appendDatasetVersion(current.datasetId, taskIds);
      }
    }

    const [dataset] = await this.db
      .insert(datasetTable)
      .values({ name: fallbackDatasetName, projectId })
      .returning();
    return this.appendDatasetVersion(dataset.id, taskIds);
  }

  /**
   * Append a new version to a dataset with the given task list.
   * Version number is max(existing) + 1 (starting at 1).
   */
  private async appendDatasetVersion(
    datasetId: number,
    taskIds: number[],
  ): Promise<number> {
    const existing = await this.db.query.datasetVersionTable.findMany({
      where: { datasetId },
    });
    const nextVersion =
      existing.length > 0 ? Math.max(...existing.map((v) => v.version)) + 1 : 1;

    const [version] = await this.db
      .insert(datasetVersionTable)
      .values({ datasetId, version: nextVersion })
      .returning();

    await this.db.insert(datasetVersionTaskTable).values(
      taskIds.map((taskId) => ({ datasetVersionId: version.id, taskId })),
    );

    return version.id;
  }
}
