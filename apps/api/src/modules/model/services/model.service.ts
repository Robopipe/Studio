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
import { ModelStatusEnum, ProjectTypeEnum, TaskStatusEnum } from "@repo/schema";
import { ProjectLabelRepository } from "../../../repository/services/project-label-repository.service";
import { DB_CONNECTION } from "../../../core/database/database.constant";
import type { DbConnection } from "../../../core/database/types/database.types";
import { classificationAnnotationTable, datasetTable, datasetVersionTable, datasetVersionTaskTable, modelAugmentationTable, modelLabelTable, modelPreprocessingTable, polygonAnnotationTable, rectangleAnnotationTable, taskTable } from "@repo/database";
import { and, count, eq, inArray, isNull, sql, type SQL } from "drizzle-orm";
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
    await this.assertHasLabeledTasks(projectId, data.taskIds, data.trainingType, data.annotationsUsed);

    const labels = await this.getValidLabels(projectId, data.labelIds)

    const createdModel = await this.modelRepository.create({
      name: data.name,
      epochs: data.epochs,
      status: ModelStatusEnum.DRAFT,
      outputTypes: data.outputTypes,
      backend: data.backend,
      region: data.region,
      quantization: data.quantization,
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
        data.sourceDatasetVersionId ?? null,
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

    await this.assertHasLabeledTasks(projectId, data.taskIds, data.trainingType, data.annotationsUsed);

    const labels = await this.getValidLabels(projectId, data.labelIds)

    await this.modelRepository.update(model.id, {
      name: data.name,
      epochs: data.epochs,
      outputTypes: data.outputTypes,
      backend: data.backend,
      region: data.region,
      quantization: data.quantization,
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
    await this.assertHasLabeledTasks(model.projectId, model.taskIds, model.trainingType, model.annotationsUsed);
    await this.trainingExternalService.train(model)
    return this.modelRepository.update(id, {
      status: ModelStatusEnum.TRAINING
    })
  }


  /**
   * Cancel a running training job.
   * Flips the model to CANCELLED first so any late webhooks from the
   * (still-shutting-down) Batch job are ignored, then asks Cloud Batch to
   * delete the job. Per-epoch logs already persisted are left intact.
   */
  public async cancelTraining(id: number, projectId: number): Promise<ModelEntity> {
    const model = await this.getModelById(id, projectId)

    if (
      model.status !== ModelStatusEnum.TRAINING &&
      model.status !== ModelStatusEnum.CONVERTING
    ) {
      throw new BadRequestException("Model is not currently training")
    }

    if (!model.batchJobName) {
      throw new BadRequestException("Model has no associated batch job to cancel")
    }

    await this.modelRepository.update(id, { status: ModelStatusEnum.CANCELLED })
    // Best-effort: status is already CANCELLED locally, so late webhooks
    // from a still-running container will be dropped. A NOT_FOUND here
    // (job already finished) is effectively the outcome we wanted.
    await this.trainingExternalService.cancelBatchJob(model.batchJobName).catch(() => undefined)

    return this.getModelById(id, projectId)
  }


  public async countLabeledTasks(
    projectId: number,
    taskIds: number[],
    trainingType: ProjectTypeEnum,
    annotationsUsed: ProjectTypeEnum[],
  ): Promise<{ labeledCount: number; totalCandidateCount: number }> {
    const baseConditions = and(
      eq(taskTable.projectId, projectId),
      eq(taskTable.status, TaskStatusEnum.DONE),
      isNull(taskTable.deletedAt),
      taskIds.length > 0 ? inArray(taskTable.id, taskIds) : undefined,
    );

    const [totalRow] = await this.db
      .select({ total: count() })
      .from(taskTable)
      .where(baseConditions);

    const annotationExistsExpr = this.buildAnnotationExistsExpr(trainingType, annotationsUsed);

    const [labeledRow] = await this.db
      .select({ labeled: count() })
      .from(taskTable)
      .where(and(baseConditions, annotationExistsExpr));

    return {
      labeledCount: labeledRow?.labeled ?? 0,
      totalCandidateCount: totalRow?.total ?? 0,
    };
  }

  private buildAnnotationExistsExpr(trainingType: ProjectTypeEnum, annotationsUsed: ProjectTypeEnum[]): SQL {
    switch (trainingType) {
      case ProjectTypeEnum.CLASSIFICATION:
        return sql`EXISTS (SELECT 1 FROM ${classificationAnnotationTable} WHERE ${classificationAnnotationTable.taskId} = ${taskTable.id} LIMIT 1)`;
      case ProjectTypeEnum.SEGMENTATION:
        return sql`EXISTS (SELECT 1 FROM ${polygonAnnotationTable} WHERE ${polygonAnnotationTable.taskId} = ${taskTable.id} LIMIT 1)`;
      case ProjectTypeEnum.DETECTION: {
        const useRect = annotationsUsed.includes(ProjectTypeEnum.DETECTION);
        const usePoly = annotationsUsed.includes(ProjectTypeEnum.SEGMENTATION);
        if (useRect && usePoly) {
          return sql`(
            EXISTS (SELECT 1 FROM ${rectangleAnnotationTable} WHERE ${rectangleAnnotationTable.taskId} = ${taskTable.id} LIMIT 1)
            OR
            EXISTS (SELECT 1 FROM ${polygonAnnotationTable} WHERE ${polygonAnnotationTable.taskId} = ${taskTable.id} LIMIT 1)
          )`;
        }
        if (useRect) {
          return sql`EXISTS (SELECT 1 FROM ${rectangleAnnotationTable} WHERE ${rectangleAnnotationTable.taskId} = ${taskTable.id} LIMIT 1)`;
        }
        return sql`EXISTS (SELECT 1 FROM ${polygonAnnotationTable} WHERE ${polygonAnnotationTable.taskId} = ${taskTable.id} LIMIT 1)`;
      }
    }
  }

  private async assertHasLabeledTasks(
    projectId: number,
    taskIds: number[],
    trainingType: ProjectTypeEnum,
    annotationsUsed: ProjectTypeEnum[],
  ): Promise<void> {
    const { labeledCount } = await this.countLabeledTasks(projectId, taskIds, trainingType, annotationsUsed);
    if (labeledCount === 0) {
      throw new BadRequestException(
        "Dataset has no labeled images for the selected training type. Label at least one image (or adjust the annotation types used) before continuing.",
      );
    }
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
        with: { dataset: true },
      });
      // Only reuse/extend a version if its dataset belongs to this project
      if (current && current.dataset?.projectId === projectId) {
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
