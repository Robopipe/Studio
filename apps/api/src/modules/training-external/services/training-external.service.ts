import { BadRequestException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";
import { DB_CONNECTION } from "../../../core/database/database.constant";
import type { DbConnection } from "../../../core/database/types/database.types";
import {
  TrainingProgressTypeEnum,
  type TrainingBasePayload,
  type TrainingCompleteData,
  type TrainingPayload,
  type TrainingProgressData,
} from "../schema/training-external.schema";
import { ModelEntity } from "../../model/entity/model.entity";
import {
  ProjectTypeEnum,
  TaskStatusEnum,
  ModelOutputTypeEnum,
  TaskFileTypeEnum,
  ModelStatusEnum,
} from "@repo/schema";
import { HttpService } from "@nestjs/axios";
import { ModelLogRepository } from "../../../repository/services/model-log-repository.service";
import { ModelOutputRepository } from "../../../repository/services/model-output-repository.service";
import { ModelRepository } from "../../../repository/services/model-repository.service";
import { AssetsService } from "../../assets/services/assets.service";
import { AppConfig } from "../../../core/configuration/app.config";
import { Storage } from "@google-cloud/storage";
import { JobsClient } from "@google-cloud/run";

/** Signed-URL TTL for model-output uploads. Matches the 1h Cloud Run Job timeout with plenty of headroom. */
const UPLOAD_URL_TTL_MS = 24 * 60 * 60 * 1000;

type OutputUpload = { type: ModelOutputTypeEnum; url: string; object_path: string };

@Injectable()
export class TrainingExternalService {
  private readonly logger = new Logger(TrainingExternalService.name);
  private readonly jobsClient = new JobsClient()

  constructor(
    @Inject(DB_CONNECTION) private readonly db: DbConnection,
    private readonly http: HttpService,
    private readonly assetsService: AssetsService,
    private readonly config: AppConfig,
    private readonly modelRepository: ModelRepository,
    private readonly modelLogRepository: ModelLogRepository,
    private readonly modelOutputRepository: ModelOutputRepository,
  ) {}

  /**
   * Update training progress (per-epoch log, conversion-started marker, or error).
   * @throws NotFoundException - Model not found
   */
  public async updateTrainingProgress(
    modelId: number,
    data: TrainingProgressData,
  ): Promise<void> {
    const model = await this.modelRepository.getById(modelId);
    if(!model){
      throw new NotFoundException("Model not found")
    }

    const { progress } = data;

    switch (progress.type) {
      case TrainingProgressTypeEnum.ERROR:
        await this.modelRepository.update(modelId, {
          status: ModelStatusEnum.ERROR,
          errorMessage: progress.errorMessage,
        });
        return;

      case TrainingProgressTypeEnum.CONVERTING:
        await this.modelRepository.update(modelId, {
          status: ModelStatusEnum.CONVERTING,
        });
        return;

      case TrainingProgressTypeEnum.LOG:
        await this.modelLogRepository.create({
          modelId,
          epoch: progress.epoch,
          metrics: progress.metrics,
        });
        return;
    }
  }

  /**
   * Finalize a training job after the ML service has uploaded every output
   * directly to its signed GCS URL. Verifies each expected object exists,
   * persists ModelOutput rows, and flips the model to DONE.
   *
   * Security: each reported objectPath must fall under the model's own prefix
   * to prevent a compromised ML service from linking arbitrary GCS objects.
   */
  public async completeTraining(
    modelId: number,
    data: TrainingCompleteData,
  ): Promise<void> {
    const model = await this.modelRepository.getById(modelId);
    if (!model) {
      throw new NotFoundException("Model not found");
    }

    const expectedTypes = new Set(model.outputTypes);
    const reportedTypes = new Set(data.outputs.map((o) => o.type));

    for (const type of expectedTypes) {
      if (!reportedTypes.has(type)) {
        await this.failModel(modelId, `Training complete webhook missing output type: ${type}`);
        throw new BadRequestException(`Missing output type in complete payload: ${type}`);
      }
    }

    const prefix = `${model.projectId}/model/${model.id}/`;
    const existingOutputs = await this.modelOutputRepository.getAllByModelId(modelId);
    const existingTypes = new Set(existingOutputs.map((o) => o.type));

    for (const output of data.outputs) {
      if (!expectedTypes.has(output.type)) {
        // Not a hard failure — just skip unexpected types.
        this.logger.warn(`Model ${modelId} reported unexpected output type ${output.type}`);
        continue;
      }

      if (existingTypes.has(output.type)) {
        continue;
      }

      if (!output.objectPath.startsWith(prefix)) {
        await this.failModel(modelId, `Rejected object path outside model prefix: ${output.objectPath}`);
        throw new BadRequestException(`Object path must start with ${prefix}`);
      }

      const exists = await this.assetsService.fileExists(output.objectPath);
      if (!exists) {
        await this.failModel(modelId, `Uploaded file not found in storage: ${output.objectPath}`);
        throw new BadRequestException(`File not found in storage: ${output.objectPath}`);
      }

      await this.modelOutputRepository.create({
        modelId: model.id,
        type: output.type,
        filePath: this.assetsService.getPublicUrl(output.objectPath),
        fileType: TaskFileTypeEnum.GS,
      });
    }

    await this.modelRepository.update(model.id, {
      status: ModelStatusEnum.DONE,
      finalAccuracy: data.finalAccuracy,
      finalLoss: data.finalLoss,
    });
  }

  /**
   * Train
   * @param model - Model entity
   */
  public async train(model: ModelEntity): Promise<void> {
    const outputUploads = await this.generateOutputUploads(model);
    const trainingPayload = await this.getTrainingPayload(model, outputUploads);

    this.logger.log(`Train config: mlJobName=${this.config.mlJobName}, mlHost=${this.config.mlHost}`);
    if (this.config.mlJobName) {
      await this.trainViaJob(trainingPayload);
    } else if (this.config.mlHost) {
      await this.trainViaHttp(trainingPayload);
    } else {
      throw new InternalServerErrorException("No ML training backend configured. Set either ML_HOST or ML_JOB_NAME.");
    }
  }

  /**
   * Generate a signed PUT URL for every output type the model expects.
   * Paths follow `{projectId}/model/{modelId}/{type_lower}/{uuid}.{ext}`
   * so verification can enforce the prefix later.
   */
  private async generateOutputUploads(model: ModelEntity): Promise<OutputUpload[]> {
    const uploads: OutputUpload[] = [];
    for (const type of model.outputTypes) {
      const objectPath = this.assetsService.getModelOutputPath(model.projectId, model.id, type);
      const url = await this.assetsService.generateSignedUploadUrl(
        objectPath,
        "application/octet-stream",
        UPLOAD_URL_TTL_MS,
      );
      uploads.push({ type, url, object_path: objectPath });
    }
    return uploads;
  }

  private async failModel(modelId: number, message: string): Promise<void> {
    this.logger.error(`Model ${modelId}: ${message}`);
    await this.modelRepository.update(modelId, {
      status: ModelStatusEnum.ERROR,
      errorMessage: message,
    });
  }

  private async trainViaHttp(trainingPayload: TrainingPayload): Promise<void> {
    try {
      await this.http.axiosRef.post("/train/", trainingPayload);
    } catch (e) {
      this.logger.error(
        `Failed starting training on machine learning service`,
        e,
      );
      throw e;
    }
  }

  private async trainViaJob(trainingPayload: TrainingPayload): Promise<void> {
    const { mlJobName, mlRegion, gcpProject, bucketName } = this.config;

    try {
      const storage = new Storage();
      const bucket = storage.bucket(bucketName);
      const configPath = `training-configs/${trainingPayload.id}/${Date.now()}.json`;
      const file = bucket.file(configPath);

      await file.save(JSON.stringify(trainingPayload), {
        contentType: "application/json",
      });

      const [signedUrl] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
      });

      const jobName = `projects/${gcpProject}/locations/${mlRegion}/jobs/${mlJobName}`;

      await this.jobsClient.runJob({
        name: jobName,
        overrides: {
          containerOverrides: [
            {
              env: [{ name: "CONFIG_URL", value: signedUrl }],
            },
          ],
        },
      });

      this.logger.log(`Cloud Run Job triggered for model ${trainingPayload.id}`);
    } catch (e) {
      this.logger.error(`Failed triggering Cloud Run Job for model ${trainingPayload.id}`, e);
      throw e;
    }
  }

  /**
   * Get training payload for machine learning service
   */
  private async getTrainingPayload(
    model: ModelEntity,
    outputUploads: OutputUpload[],
  ): Promise<TrainingPayload> {
    const allTasks = await this.db.query.taskTable.findMany({
      where: {
        projectId: model.projectId,
        status: TaskStatusEnum.DONE,
      },
      with: {
        classificationAnnotations: true,
        rectangleAnnotations: true,
        polygonAnnotations: true,
      },
    });

    // If model has a custom dataset, filter to only selected tasks
    const tasks = model.taskIds.length > 0
      ? allTasks.filter((t) => model.taskIds.includes(t.id))
      : allTasks;

    const labelsIndexMap = model.labels.reduce(
      (acc: Record<number, number>, current, currentIndex) => {
        acc[current.id] = currentIndex;
        return acc;
      },
      {},
    );

    const augmentations = await this.db.query.modelAugmentationTable.findMany({
      where: {
        modelId: model.id,
      }
    })

    const preprocessings = await this.db.query.modelPreprocessingTable.findMany({
      where: {
        modelId: model.id,
      }
    })

    const basePayload: TrainingBasePayload = {
      id: model.id,
      output_config: outputUploads,
      training_config: {
        output_types: model.outputTypes,
        epochs: model.epochs,
        dataset_config: {
          dataset_split: [
            model.splitTrain,
            model.splitValidate,
            model.splitTest,
          ],
          labels: model.labels.map((_, index) => index),
          augmentations,
          preprocessings: preprocessings.map(pp => ({
            type: pp.type,
            params: pp.params,
            keep_original: pp.keepOriginal,
          })),
        },
        custom_hyperparams: model.customHyperparams,
      },
    };

    switch (model.trainingType) {
      case ProjectTypeEnum.CLASSIFICATION: {
        const data = tasks.map((task) => ({
          file_url: task.filePath,
          width: task.width,
          height: task.height,
          labels: task.classificationAnnotations.map((annotation) => ({
            label: {
              label_number: labelsIndexMap[annotation.labelId],
            },
          })),
        }));

        return { ...basePayload, type: ProjectTypeEnum.CLASSIFICATION, data };
      }

      case ProjectTypeEnum.SEGMENTATION: {
        const data = tasks.map((task) => ({
          file_url: task.filePath,
          width: task.width,
          height: task.height,
          labels: task.polygonAnnotations.map((annotation) => ({
            label: { label_number: labelsIndexMap[annotation.labelId] },
            points: annotation.value,
          })),
        }));

        return { ...basePayload, type: ProjectTypeEnum.SEGMENTATION, data };
      }

      case ProjectTypeEnum.DETECTION: {
        const useDetection = model.annotationsUsed.includes(ProjectTypeEnum.DETECTION);
        const useSegmentation = model.annotationsUsed.includes(ProjectTypeEnum.SEGMENTATION);

        const data = tasks.map((task) => {
          const labels = [];

          if (useDetection) {
            for (const annotation of task.rectangleAnnotations) {
              labels.push({
                label: { label_number: labelsIndexMap[annotation.labelId] },
                x: annotation.x,
                y: annotation.y,
                width: annotation.width,
                height: annotation.height,
              });
            }
          }

          if (useSegmentation) {
            for (const annotation of task.polygonAnnotations) {
              labels.push({
                label: { label_number: labelsIndexMap[annotation.labelId] },
                points: annotation.value,
              });
            }
          }

          return { file_url: task.filePath, width: task.width, height: task.height, labels };
        });

        return { ...basePayload, type: ProjectTypeEnum.DETECTION, data };
      }
    }
  }
}
