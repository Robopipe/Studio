import { BadRequestException, ConflictException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";
import { DB_CONNECTION } from "../../../core/database/database.constant";
import type { DbConnection } from "../../../core/database/types/database.types";
import {
  TrainingProgressTypeEnum,
  type TrainingBasePayload,
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
   * Upload model output
   * @param modelId
   * @param type
   * @param file
   * @throws NotFoundException - Model not found
   */
  public async uploadModelOutput(
    modelId: number,
    type: string,
    file: Express.Multer.File,
  ): Promise<void> {
    const modelOutputType = this.parseModelOutputType(type)
    if(!modelOutputType){
      throw new BadRequestException(`Invalid model output type: ${type}`)
    }

    const model = await this.modelRepository.getById(modelId);
    if(!model){
      throw new NotFoundException("Model not found")
    }

    const modelOutputs = await this.modelOutputRepository.getAllByModelId(modelId)
    const foundExistingOutput = modelOutputs.some((modelOutput) => modelOutput.type === modelOutputType)
    if(foundExistingOutput){
      throw new ConflictException("Model output with this type already exists")
    }

    const assetPath = this.assetsService.getModelOutputName(file.originalname, model.projectId, model.id, modelOutputType)
    const assetPublicUrl = await this.assetsService.saveFile(file.buffer, file.mimetype, assetPath)

    await this.modelOutputRepository.create({
      modelId: model.id,
      type: modelOutputType,
      filePath: assetPublicUrl,
      fileType: TaskFileTypeEnum.GS
    })

    if(modelOutputType === ModelOutputTypeEnum.RAW){
      await this.modelRepository.update(model.id, {
        status: ModelStatusEnum.CONVERTING
      })
    }

    // Check if this is the last model to be uploaded
    if(modelOutputs.length === model.outputTypes.length - 1) {
      await this.modelRepository.update(model.id, {
        status: ModelStatusEnum.DONE
      })
    }
  }

  /**
   * Update training progress
   * @param modelId
   * @param data - TrainingProgressRequest
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

    if (progress.type === TrainingProgressTypeEnum.ERROR) {
      await this.modelRepository.update(modelId, {
        status: ModelStatusEnum.ERROR,
        errorMessage: progress.errorMessage,
      });
      return;
    }

    await this.modelLogRepository.create({
      modelId,
      epoch: progress.epoch,
      metrics: progress.metrics,
    });
  }

  /**
   * Train
   * @param model - Model entity
   */
  public async train(model: ModelEntity): Promise<void> {
    const trainingPayload = await this.getTrainingPayload(model);

    this.logger.log(`Train config: mlJobName=${this.config.mlJobName}, mlHost=${this.config.mlHost}`);
    if (this.config.mlJobName) {
      await this.trainViaJob(trainingPayload);
    } else if (this.config.mlHost) {
      await this.trainViaHttp(trainingPayload);
    } else {
      throw new InternalServerErrorException("No ML training backend configured. Set either ML_HOST or ML_JOB_NAME.");
    }
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
   * @param model - ModelEntity
   * @return TrainingPayload
   */
  private async getTrainingPayload(
    model: ModelEntity,
  ): Promise<TrainingPayload> {
    const tasks = await this.db.query.taskTable.findMany({
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

  /**
   * Parse model output type from string
   * @param type
   * @return ModelOutputTypeEnum or null if doesn't match
   */
  private parseModelOutputType(type: string): ModelOutputTypeEnum | null {
    switch (type.toUpperCase()) {
      case ModelOutputTypeEnum.RAW.valueOf():
        return ModelOutputTypeEnum.RAW;
      case ModelOutputTypeEnum.RVC2.valueOf():
        return ModelOutputTypeEnum.RVC2;
      case ModelOutputTypeEnum.RVC3.valueOf():
        return ModelOutputTypeEnum.RVC3;
      case ModelOutputTypeEnum.RVC4.valueOf():
        return ModelOutputTypeEnum.RVC4;
      default:
        return null
    }
  }
}
