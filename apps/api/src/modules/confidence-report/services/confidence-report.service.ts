import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { Storage } from "@google-cloud/storage";
import { BatchServiceClient, protos } from "@google-cloud/batch";
import { HttpService } from "@nestjs/axios";
import {
  ConfidenceReportComplete,
  ConfidenceReportError,
  ConfidenceReportGtGeometryEnum,
  ConfidenceReportPerClassStat,
  ConfidenceReportProgress,
  ConfidenceReportStatusEnum,
  ModelOutputTypeEnum,
  RunConfidenceReport,
  TaskStatusEnum,
} from "@repo/schema";
import { DB_CONNECTION } from "../../../core/database/database.constant";
import type { DbConnection } from "../../../core/database/types/database.types";
import { AppConfig } from "../../../core/configuration/app.config";
import { AssetsService } from "../../assets/services/assets.service";
import { ModelRepository } from "../../../repository/services/model-repository.service";
import { ConfidenceReportRepository } from "../../../repository/services/confidence-report-repository.service";
import { assertModelUsableForPreAnnotation } from "../../predict/pre-annotate-model.validator";
import {
  PreAnnotateModelTypeEnum,
  ProjectTypeEnum,
} from "@repo/schema";
import type { ConfidenceReportSelect } from "../../../repository/types/confidence-report";

/** Signed-URL TTL for the batch-job config (wide margin for long runs). */
const CONFIG_URL_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Number of tasks per progress webhook chunk. */
const PROGRESS_CHUNK_SIZE = 10;

@Injectable()
export class ConfidenceReportService {
  private readonly logger = new Logger(ConfidenceReportService.name);
  private readonly batchClient = new BatchServiceClient();

  constructor(
    @Inject(DB_CONNECTION) private readonly db: DbConnection,
    private readonly http: HttpService,
    private readonly config: AppConfig,
    private readonly assetsService: AssetsService,
    private readonly modelRepository: ModelRepository,
    private readonly confidenceReportRepository: ConfidenceReportRepository,
  ) {}

  // ─── User-facing ──────────────────────────────────────────────────────────

  /**
   * Get the current confidence report for a project.
   * Returns null when no report exists.
   */
  public async getReport(
    projectId: number,
  ): Promise<(ConfidenceReportSelect & { modelName: string | null }) | null> {
    const report = await this.confidenceReportRepository.findByProjectId(projectId);
    if (!report) return null;

    let modelName: string | null = null;
    if (report.modelId) {
      const model = await this.modelRepository.getByIdAndProjectId(report.modelId, projectId);
      modelName = model?.name ?? null;
    }

    return { ...report, modelName };
  }

  /**
   * Start a new confidence report run for the project.
   * Overwrites any existing report (including its per-task scalars).
   */
  public async run(projectId: number, body: RunConfidenceReport): Promise<ConfidenceReportSelect> {
    // Guard: no concurrent runs.
    const existing = await this.confidenceReportRepository.findByProjectId(projectId);
    if (existing?.status === ConfidenceReportStatusEnum.RUNNING || existing?.status === ConfidenceReportStatusEnum.PENDING) {
      throw new ConflictException(
        "A confidence report is already running for this project. Cancel it before starting a new one.",
      );
    }

    // Validate backend availability.
    if (!this.config.mlBatchImageInfer && !this.config.mlHostInfer) {
      throw new ServiceUnavailableException(
        "No confidence-report backend configured. Set either ML_HOST_INFER or ML_BATCH_IMAGE_INFER.",
      );
    }

    // Load and validate the model.
    const model = await this.modelRepository.getByIdAndProjectId(body.modelId, projectId);
    if (!model) {
      throw new NotFoundException("Model not found in this project");
    }

    const modelType =
      model.trainingType === ProjectTypeEnum.DETECTION
        ? PreAnnotateModelTypeEnum.DETECTION
        : PreAnnotateModelTypeEnum.SEGMENTATION;
    assertModelUsableForPreAnnotation(model, modelType, { requireUltralyticsBackend: true });

    // Load all (non-deleted) tasks in the project.
    const tasks = await this.db.query.taskTable.findMany({
      where: { projectId, deletedAt: { isNull: true } },
      with: {
        rectangleAnnotations: true,
        polygonAnnotations: true,
      },
    });

    if (tasks.length === 0) {
      throw new BadRequestException("No tasks found in this project");
    }

    // RAW output guaranteed by the validator.
    const rawOutput = model.outputs.find((o) => o.type === ModelOutputTypeEnum.RAW)!;

    // Sign URLs.
    const [modelUrl, ...imageUrls] = await Promise.all([
      this.assetsService.generateSignedDownloadUrl(rawOutput.filePath, CONFIG_URL_TTL_MS),
      ...tasks.map((t) => this.assetsService.generateSignedDownloadUrl(t.filePath, CONFIG_URL_TTL_MS)),
    ]);

    // Build GT per task (in percentage coordinates — same as stored).
    const gtGeometry = body.gtGeometry;
    const taskPayloads = tasks.map((task, i) => {
      const gt =
        gtGeometry === ConfidenceReportGtGeometryEnum.RECTANGLE
          ? task.rectangleAnnotations.map((a) => ({
              labelId: a.labelId,
              box: { x: a.x, y: a.y, width: a.width, height: a.height },
            }))
          : task.polygonAnnotations.map((a) => ({
              labelId: a.labelId,
              polygon: a.value as [number, number][],
            }));

      return {
        taskId: task.id,
        imageUrl: imageUrls[i],
        width: task.width,
        height: task.height,
        gt,
        // Whether this task has GT of the requested geometry (used by the
        // Python job to skip IoU/F1 computation without erroring).
        hasGt: gt.length > 0,
      };
    });

    // Clear previous per-task scalars from the task table.
    await this.confidenceReportRepository.clearTaskScalars(projectId);

    // Create the report row in PENDING state.
    const report = await this.confidenceReportRepository.upsert({
      projectId,
      modelId: model.id,
      conf: body.conf,
      gtGeometry: body.gtGeometry,
      status: ConfidenceReportStatusEnum.PENDING,
      processed: 0,
      total: tasks.length,
      batchJobName: null,
      errorMessage: null,
      perClassStats: null,
    });

    // Build the config payload for the batch job.
    const jobConfig = {
      reportId: report.id,
      projectId,
      modelUrl,
      modelId: model.id,
      conf: body.conf,
      iou: 0.45,
      gtGeometry: body.gtGeometry,
      // Ordered by labelId ASC — matches ONNX class index convention.
      labelIds: model.labels.map((l) => l.id),
      labelNames: model.labels.map((l) => l.name),
      labelColors: model.labels.map((l) => l.color),
      tasks: taskPayloads,
      progressChunkSize: PROGRESS_CHUNK_SIZE,
      webhookUrl: `${this.config.apiHost}/v1/confidence-report/webhook`,
    };

    // Dispatch.
    if (this.config.mlBatchImageInfer) {
      await this.dispatchViaBatch(report, jobConfig, this.config.mlBatchImageInfer);
    } else {
      await this.dispatchViaHttp(jobConfig, this.config.mlHostInfer!);
    }

    // Flip to RUNNING.
    return this.confidenceReportRepository.update(report.id, {
      status: ConfidenceReportStatusEnum.RUNNING,
    });
  }

  /**
   * Cancel a running report job.
   */
  public async cancel(projectId: number): Promise<void> {
    const report = await this.confidenceReportRepository.findByProjectId(projectId);
    if (!report) {
      throw new NotFoundException("No confidence report found for this project");
    }

    if (
      report.status !== ConfidenceReportStatusEnum.RUNNING &&
      report.status !== ConfidenceReportStatusEnum.PENDING
    ) {
      throw new BadRequestException(
        `Cannot cancel a report in ${report.status} state`,
      );
    }

    // Mark cancelled immediately so late webhooks are ignored.
    await this.confidenceReportRepository.update(report.id, {
      status: ConfidenceReportStatusEnum.CANCELLED,
    });

    if (report.batchJobName) {
      try {
        await this.batchClient.deleteJob({ name: report.batchJobName });
        this.logger.log(`Cloud Batch job ${report.batchJobName} deletion requested`);
      } catch (e) {
        this.logger.error(`Failed deleting Cloud Batch job ${report.batchJobName}`, e);
        // Don't re-throw — the report is already marked CANCELLED, so late
        // webhooks will be ignored even if the Batch job keeps running briefly.
      }
    }
  }

  // ─── Webhook handlers (called by ConfidenceReportWebhookController) ───────

  /**
   * Progress webhook — batch job sends this every N tasks.
   */
  public async handleProgress(reportId: number, data: ConfidenceReportProgress): Promise<void> {
    const report = await this.confidenceReportRepository.findById(reportId);
    if (!report) {
      this.logger.warn(`Progress webhook for unknown report ${reportId}`);
      return;
    }

    if (
      report.status === ConfidenceReportStatusEnum.CANCELLED ||
      report.status === ConfidenceReportStatusEnum.DONE ||
      report.status === ConfidenceReportStatusEnum.ERROR
    ) {
      this.logger.log(
        `Report ${reportId}: ignoring progress webhook in ${report.status} state`,
      );
      return;
    }

    await this.confidenceReportRepository.bulkUpsertTaskScalars(
      report.projectId,
      data.taskResults,
    );

    await this.confidenceReportRepository.update(reportId, {
      processed: data.processed,
      total: data.total,
    });
  }

  /**
   * Complete webhook — batch job sends this once when all tasks are done.
   */
  public async handleComplete(
    reportId: number,
    data: ConfidenceReportComplete,
  ): Promise<void> {
    const report = await this.confidenceReportRepository.findById(reportId);
    if (!report) {
      this.logger.warn(`Complete webhook for unknown report ${reportId}`);
      return;
    }

    if (
      report.status === ConfidenceReportStatusEnum.CANCELLED ||
      report.status === ConfidenceReportStatusEnum.DONE
    ) {
      this.logger.log(
        `Report ${reportId}: ignoring complete webhook in ${report.status} state`,
      );
      return;
    }

    await this.confidenceReportRepository.update(reportId, {
      status: ConfidenceReportStatusEnum.DONE,
      perClassStats: data.perClassStats as ConfidenceReportPerClassStat[],
      processed: report.total,
    });
  }

  /**
   * Error webhook — batch job sends this on failure.
   */
  public async handleError(reportId: number, data: ConfidenceReportError): Promise<void> {
    const report = await this.confidenceReportRepository.findById(reportId);
    if (!report) {
      this.logger.warn(`Error webhook for unknown report ${reportId}`);
      return;
    }

    if (report.status === ConfidenceReportStatusEnum.CANCELLED) {
      this.logger.log(`Report ${reportId}: ignoring error webhook after cancel`);
      return;
    }

    this.logger.error(`Report ${reportId} failed: ${data.errorMessage}`);
    await this.confidenceReportRepository.update(reportId, {
      status: ConfidenceReportStatusEnum.ERROR,
      errorMessage: data.errorMessage,
    });
  }

  // ─── Dispatch helpers ─────────────────────────────────────────────────────

  private async dispatchViaHttp(jobConfig: object, httpHost: string): Promise<void> {
    try {
      await this.http.axiosRef.post(
        `${httpHost.replace(/\/$/, "")}/report/`,
        jobConfig,
        { headers: { Authorization: this.config.mlInferApiKey } },
      );
    } catch (e) {
      this.logger.error("Failed starting confidence-report job via HTTP", e);
      throw e;
    }
  }

  private async dispatchViaBatch(
    report: ConfidenceReportSelect,
    jobConfig: object,
    batchImage: string,
  ): Promise<void> {
    const { gcpProject, bucketName, mlBatchServiceAccount, mlBatchApiKeySecret, mlBatchNetwork, mlBatchSubnetwork, mlBatchInferMachineType, mlBatchInferBootDiskGb, mlBatchInferMaxRunSeconds, mlBatchInferTaskCpuMilli, mlBatchInferTaskMemoryMib } = this.config;

    if (!gcpProject) {
      throw new InternalServerErrorException(
        "Cloud Batch requires GCP_PROJECT to be set.",
      );
    }

    try {
      const storage = new Storage();
      const bucket = storage.bucket(bucketName);
      const configPath = `confidence-report-configs/${report.id}/${Date.now()}.json`;
      const file = bucket.file(configPath);

      await file.save(JSON.stringify(jobConfig), { contentType: "application/json" });

      const [signedUrl] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + CONFIG_URL_TTL_MS,
      });

      const region = this.config.mlRegion ?? "europe-west4";
      const parent = `projects/${gcpProject}/locations/${region}`;
      const jobId = `report-${report.id}-${Date.now()}`.toLowerCase();

      const secretVariables: Record<string, string> = {};
      if (mlBatchApiKeySecret) {
        secretVariables.API_KEY = `projects/${gcpProject}/secrets/${mlBatchApiKeySecret}/versions/latest`;
      }

      const instancePolicy: protos.google.cloud.batch.v1.AllocationPolicy.IInstancePolicy = {
        machineType: mlBatchInferMachineType,
        bootDisk: { sizeGb: String(mlBatchInferBootDiskGb), type: "pd-ssd" },
        provisioningModel: "SPOT",
      };

      const networkInterfaces = mlBatchNetwork
        ? [{ network: mlBatchNetwork, subnetwork: mlBatchSubnetwork, noExternalIpAddress: false }]
        : undefined;

      const job: protos.google.cloud.batch.v1.IJob = {
        taskGroups: [
          {
            taskCount: "1",
            parallelism: "1",
            taskSpec: {
              runnables: [
                {
                  container: { imageUri: batchImage },
                  environment: {
                    variables: {
                      CONFIG_URL: signedUrl,
                      WEBHOOK_URL: `${this.config.apiHost}/v1/confidence-report/webhook`,
                      APP_ENV: this.config.env,
                    },
                    ...(Object.keys(secretVariables).length > 0 ? { secretVariables } : {}),
                  },
                },
              ],
              computeResource: {
                cpuMilli: mlBatchInferTaskCpuMilli,
                memoryMib: mlBatchInferTaskMemoryMib,
              },
              maxRunDuration: { seconds: String(mlBatchInferMaxRunSeconds) },
              maxRetryCount: 0,
            },
          },
        ],
        allocationPolicy: {
          instances: [
            {
              policy: instancePolicy,
              installGpuDrivers: false,
            },
          ],
          ...(mlBatchServiceAccount
            ? { serviceAccount: { email: mlBatchServiceAccount } }
            : {}),
          ...(networkInterfaces ? { network: { networkInterfaces } } : {}),
        },
        logsPolicy: { destination: "CLOUD_LOGGING" },
        labels: { report_id: String(report.id), app_env: this.config.env },
      };

      const [createdJob] = await this.batchClient.createJob({ parent, jobId, job });

      if (createdJob?.name) {
        await this.confidenceReportRepository.update(report.id, {
          batchJobName: createdJob.name,
        });
      }

      this.logger.log(`Cloud Batch job ${jobId} submitted for report ${report.id}`);
    } catch (e) {
      this.logger.error(`Failed submitting Cloud Batch job for report ${report.id}`, e);
      await this.confidenceReportRepository.update(report.id, {
        status: ConfidenceReportStatusEnum.ERROR,
        errorMessage: "Failed to dispatch Cloud Batch job",
      });
      throw e;
    }
  }
}
