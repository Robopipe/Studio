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
  ModelRegionEnum,
} from "@repo/schema";
import { HttpService } from "@nestjs/axios";
import { ModelLogRepository } from "../../../repository/services/model-log-repository.service";
import { ModelOutputRepository } from "../../../repository/services/model-output-repository.service";
import { ModelRepository } from "../../../repository/services/model-repository.service";
import { AssetsService } from "../../assets/services/assets.service";
import { AppConfig } from "../../../core/configuration/app.config";
import { Storage } from "@google-cloud/storage";
import { BatchServiceClient, protos } from "@google-cloud/batch";

/** Signed-URL TTL for model-output uploads. Covers Cloud Batch's multi-day ceiling with plenty of headroom. */
const UPLOAD_URL_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type OutputUpload = { type: ModelOutputTypeEnum; url: string; object_path: string };

@Injectable()
export class TrainingExternalService {
  private readonly logger = new Logger(TrainingExternalService.name);
  private readonly batchClient = new BatchServiceClient();

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

    // User cancelled — Cloud Batch shutdown is async, so late webhooks can
    // still arrive while the container is being torn down. Drop them.
    if (model.status === ModelStatusEnum.CANCELLED) {
      this.logger.log(`Model ${modelId}: ignoring progress webhook after cancel`);
      return;
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
          perClassMetrics: progress.perClassMetrics ?? null,
          confusionMatrix: progress.confusionMatrix ?? null,
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

    if (model.status === ModelStatusEnum.CANCELLED) {
      this.logger.log(`Model ${modelId}: ignoring completion webhook after cancel`);
      return;
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
      bestMap50: data.bestMap50 ?? null,
    });
  }

  /**
   * Cancel a running training job by deleting its Cloud Batch job.
   * Cloud Batch has no "cancel" verb — `deleteJob` is the termination path
   * and takes effect asynchronously (the container is SIGKILLed after a
   * grace period). Callers should set the model status immediately so late
   * webhooks get ignored (see updateTrainingProgress / completeTraining).
   */
  public async cancelBatchJob(batchJobName: string): Promise<void> {
    try {
      await this.batchClient.deleteJob({ name: batchJobName });
      this.logger.log(`Cloud Batch job ${batchJobName} deletion requested`);
    } catch (e) {
      this.logger.error(`Failed deleting Cloud Batch job ${batchJobName}`, e);
      throw e;
    }
  }

  /**
   * Train
   * @param model - Model entity
   *
   * Dispatches the training run to the ml-yolo service — as a Cloud Batch job
   * (Cloud, GPU VM) when an image is configured, otherwise POSTed to the
   * FastAPI host for local dev.
   */
  public async train(model: ModelEntity): Promise<void> {
    const outputUploads = await this.generateOutputUploads(model);
    const trainingPayload = await this.getTrainingPayload(model, outputUploads);

    const batchImage = this.config.mlBatchImageYolo;
    const httpHost = this.config.mlHostYolo;

    this.logger.log(
      `Train dispatch: model=${model.id} batchImage=${batchImage ?? "-"} httpHost=${httpHost ?? "-"}`,
    );

    if (batchImage) {
      await this.trainViaBatch(trainingPayload, batchImage, model.region);
    } else if (httpHost) {
      await this.trainViaHttp(trainingPayload, httpHost);
    } else {
      throw new InternalServerErrorException(
        "No ML training backend configured. Set either ML_HOST_YOLO or ML_BATCH_IMAGE_YOLO.",
      );
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

  private async trainViaHttp(trainingPayload: TrainingPayload, httpHost: string): Promise<void> {
    try {
      // Use an absolute URL so axios ignores the module-level baseURL. Still
      // inherits the Authorization header from HttpModule.registerAsync (ML_SECRET).
      await this.http.axiosRef.post(`${httpHost.replace(/\/$/, "")}/train/`, trainingPayload);
    } catch (e) {
      this.logger.error(
        `Failed starting training on machine learning service`,
        e,
      );
      throw e;
    }
  }

  private async trainViaBatch(
    trainingPayload: TrainingPayload,
    mlBatchImage: string,
    region: ModelRegionEnum,
  ): Promise<void> {
    const {
      gcpProject,
      bucketName,
      apiHost,
      mlBatchServiceAccount,
      mlBatchMachineType,
      mlBatchGpuType,
      mlBatchGpuCount,
      mlBatchBootDiskImage,
      mlBatchBootDiskGb,
      mlBatchMaxRunSeconds,
      mlBatchTaskCpuMilli,
      mlBatchTaskMemoryMib,
      mlBatchShmSize,
      mlBatchApiKeySecret,
      mlBatchHubaiApiKeySecret,
      mlBatchNetwork,
      mlBatchSubnetwork,
    } = this.config;

    if (!gcpProject || !mlBatchImage) {
      throw new InternalServerErrorException(
        "Cloud Batch training requires GCP_PROJECT and ML_BATCH_IMAGE to be set.",
      );
    }

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
        expires: Date.now() + UPLOAD_URL_TTL_MS,
      });

      const parent = `projects/${gcpProject}/locations/${region}`;
      // Batch requires lowercase alphanum + dashes, ≤63 chars.
      const jobId = `train-${trainingPayload.id}-${Date.now()}`.toLowerCase();

      const secretVariables: Record<string, string> = {};
      if (mlBatchApiKeySecret) {
        secretVariables.API_KEY = `projects/${gcpProject}/secrets/${mlBatchApiKeySecret}/versions/latest`;
      }
      if (mlBatchHubaiApiKeySecret) {
        secretVariables.HUBAI_API_KEY = `projects/${gcpProject}/secrets/${mlBatchHubaiApiKeySecret}/versions/latest`;
      }

      // Accelerator-optimized VMs (A2/A3/G2) come with GPUs bundled — you set
      // machineType and Batch attaches the right GPU automatically. Setting an
      // explicit `accelerators` block with those families causes createJob to
      // fail. Only attach accelerators when ML_BATCH_GPU_TYPE is set, which is
      // the N1-style "custom attachment" path.
      // A custom boot-disk image (e.g. a Deep Learning VM) ships with the GPU
      // driver, Docker, and NVIDIA Container Toolkit pre-baked. That lets us
      // skip Batch's ~2-3 min COS driver download (installGpuDrivers) and reach
      // the GPU through the nvidia runtime (`--gpus all`) instead of the
      // COS-style /var/lib/nvidia bind-mounts. When unset, behaviour is the
      // original Container-Optimized OS path.
      const useCustomImage = Boolean(mlBatchBootDiskImage);

      const instancePolicy: protos.google.cloud.batch.v1.AllocationPolicy.IInstancePolicy = {
        machineType: mlBatchMachineType,
        bootDisk: {
          sizeGb: String(mlBatchBootDiskGb),
          type: "pd-ssd",
          ...(useCustomImage ? { image: mlBatchBootDiskImage } : {}),
        },
        // FLEX_START (Dynamic Workload Scheduler — Flex Start mode): the job is
        // queued until GPU capacity is found, then runs uninterrupted to
        // completion (no preemption, unlike SPOT). Avoids the transient
        // CODE_GCE_ZONE_RESOURCE_POOL_EXHAUSTED fast-fail by waiting instead;
        // billed at DWS pricing (~53% off on-demand).
        //
        // `reservation: "NO_RESERVATION"` is MANDATORY with FLEX_START — it's
        // what puts Batch on its DWS flex-start path, which sets the GCE
        // instance termination action for us. Without it, Batch applies a 7-day
        // instance maxRunDuration but no termination action, and GCE rejects the
        // job with CODE_GCE_BAD_REQUEST ("max-run-duration ... not supported
        // without an instance termination action").
        provisioningModel: "FLEX_START",
        reservation: "NO_RESERVATION",
      };
      if (mlBatchGpuType && mlBatchGpuCount > 0) {
        instancePolicy.accelerators = [
          { type: mlBatchGpuType, count: String(mlBatchGpuCount) },
        ];
      }

      // COS exposes the host driver to the container via bind-mounts + an
      // LD_LIBRARY_PATH pointing at them; a custom DLVM image uses the nvidia
      // container runtime, so it needs neither — just `--gpus all`.
      const nvidiaVolumes = useCustomImage
        ? []
        : [
            "/var/lib/nvidia/lib64:/usr/local/nvidia/lib64",
            "/var/lib/nvidia/bin:/usr/local/nvidia/bin",
          ];
      const containerOptions = useCustomImage
        ? `--gpus all --shm-size=${mlBatchShmSize}`
        : `--shm-size=${mlBatchShmSize}`;
      const nvidiaEnv: Record<string, string> = useCustomImage
        ? {}
        : { LD_LIBRARY_PATH: "/usr/local/nvidia/lib64" };

      const networkInterfaces = mlBatchNetwork
        ? [{
            network: mlBatchNetwork,
            subnetwork: mlBatchSubnetwork,
            noExternalIpAddress: false,
          }]
        : undefined;

      const job: protos.google.cloud.batch.v1.IJob = {
        taskGroups: [
          {
            taskCount: "1",
            parallelism: "1",
            taskSpec: {
              runnables: [
                {
                  container: {
                    imageUri: mlBatchImage,
                    // GPU access plumbing depends on the host image — see
                    // useCustomImage above. COS: bind-mount /var/lib/nvidia.
                    // DLVM: empty (the nvidia runtime injects the driver).
                    volumes: nvidiaVolumes,
                    // `options` is forwarded to `docker run`. --shm-size bumps
                    // /dev/shm from Docker's 64 MiB default; PyTorch DataLoader
                    // workers use shm for IPC and OOM the bus otherwise.
                    // On a custom image `--gpus all` enables GPU device access.
                    options: containerOptions,
                  },
                  environment: {
                    variables: {
                      CONFIG_URL: signedUrl,
                      WEBHOOK_URL: `${apiHost}/v1/training-external`,
                      APP_ENV: this.config.env,
                      ...nvidiaEnv,
                    },
                    ...(Object.keys(secretVariables).length > 0
                      ? { secretVariables }
                      : {}),
                  },
                },
              ],
              computeResource: {
                cpuMilli: mlBatchTaskCpuMilli,
                memoryMib: mlBatchTaskMemoryMib,
              },
              maxRunDuration: { seconds: String(mlBatchMaxRunSeconds) },
              maxRetryCount: 10,
              lifecyclePolicies: [
                {
                  action: protos.google.cloud.batch.v1.LifecyclePolicy.Action.RETRY_TASK,
                  actionCondition: {
                    exitCodes: [50001],
                  },
                },
              ],
            },
          },
        ],
        allocationPolicy: {
          instances: [
            {
              policy: instancePolicy,
              // On COS, install drivers — training is always GPU-backed. For
              // bundled-GPU VMs this is what turns the GPU on; for custom N1
              // attachment this installs the CUDA driver stack. A custom DLVM
              // image already has them, so installing again is wasted time.
              installGpuDrivers: !useCustomImage,
            },
          ],
          ...(mlBatchServiceAccount
            ? { serviceAccount: { email: mlBatchServiceAccount } }
            : {}),
          ...(networkInterfaces ? { network: { networkInterfaces } } : {}),
        },
        logsPolicy: { destination: "CLOUD_LOGGING" },
        labels: {
          model_id: String(trainingPayload.id),
          app_env: this.config.env,
        },
      };

      const [createdJob] = await this.batchClient.createJob({ parent, jobId, job });

      if (createdJob?.name) {
        await this.modelRepository.update(trainingPayload.id, {
          batchJobName: createdJob.name,
        });
      }

      this.logger.log(`Cloud Batch job ${jobId} submitted for model ${trainingPayload.id}`);
    } catch (e) {
      this.logger.error(`Failed submitting Cloud Batch job for model ${trainingPayload.id}`, e);
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

    const checkpointObjectPath = `${model.projectId}/model/${model.id}/checkpoint_last.pt`;
    const [checkpointPutUrl, checkpointGetUrl] = await Promise.all([
      this.assetsService.generateSignedUploadUrl(
        checkpointObjectPath,
        "application/octet-stream",
        UPLOAD_URL_TTL_MS,
      ),
      this.assetsService.generateSignedDownloadUrl(
        checkpointObjectPath,
        UPLOAD_URL_TTL_MS,
      ),
    ]);

    const basePayload: TrainingBasePayload = {
      id: model.id,
      output_config: outputUploads,
      checkpoint_config: {
        put_url: checkpointPutUrl,
        get_url: checkpointGetUrl,
      },
      training_config: {
        output_types: model.outputTypes,
        epochs: model.epochs,
        // ml-yolo consumes this to flip HubAI's quantization_mode between
        // FP16_STANDARD and INT8_STANDARD.
        quantization: model.quantization,
        dataset_config: {
          dataset_split: [
            model.splitTrain,
            model.splitValidate,
            model.splitTest,
          ],
          labels: model.labels.map((_, index) => index),
          label_ids: model.labels.map((l) => l.id),
          augmentations,
          preprocessings: preprocessings.map(pp => ({
            type: pp.type,
            params: pp.params,
            keep_original: pp.keepOriginal,
          })),
          use_groups: model.useGroups
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
            group_id: annotation.groupId,
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
                group_id: annotation.groupId,
              });
            }
          }

          if (useSegmentation) {
            for (const annotation of task.polygonAnnotations) {
              labels.push({
                label: { label_number: labelsIndexMap[annotation.labelId] },
                points: annotation.value,
                group_id: annotation.groupId,
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
