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
import { v2 as runV2 } from "@google-cloud/run";
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
import type { ConfidenceReportRegionResponse } from "@repo/schema";

/** Signed-URL TTL for the job config stored in GCS (wide margin for long runs). */
const CONFIG_URL_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Number of tasks per progress webhook chunk. */
const PROGRESS_CHUNK_SIZE = 10;

@Injectable()
export class ConfidenceReportService {
  private readonly logger = new Logger(ConfidenceReportService.name);
  private readonly jobsClient = new runV2.JobsClient();
  private readonly executionsClient = new runV2.ExecutionsClient();

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
   * Get inferred regions for a specific task in a project's confidence report.
   */
  public async getRegions(
    projectId: number,
    taskId: number,
  ): Promise<ConfidenceReportRegionResponse[]> {
    return this.confidenceReportRepository.getRegionsByTask(projectId, taskId);
  }

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
    if (!this.config.mlInferJobName && !this.config.mlHostInfer) {
      throw new ServiceUnavailableException(
        "No confidence-report backend configured. Set either ML_HOST_INFER (local dev) or ML_INFER_JOB_NAME (deployed).",
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
              annotationId: a.id,
              box: { x: a.x, y: a.y, width: a.width, height: a.height },
            }))
          : task.polygonAnnotations.map((a) => ({
              labelId: a.labelId,
              annotationId: a.id,
              polygon: a.value as [number, number][],
            }));

      return {
        taskId: task.id,
        imageUrl: imageUrls[i],
        width: task.width,
        height: task.height,
        gt,
        // Whether this task has GT of the requested geometry (used by the
        // Python job to skip IoU computation without erroring).
        hasGt: gt.length > 0,
        // TODO tasks have unknown (not empty) GT: the job reports null
        // meanIou/precision/recall for them and excludes them from
        // dataset-level P/R.
        annotated: task.status === TaskStatusEnum.DONE,
      };
    });

    // Clear previous per-task scalars from the task table.
    await this.confidenceReportRepository.clearTaskScalars(projectId);

    // Create / overwrite the report row in PENDING state.
    // The upsert uses onConflictDoUpdate (keeps the same PK), so clearRegions
    // must run after to reference the correct report.id.
    const report = await this.confidenceReportRepository.upsert({
      projectId,
      modelId: model.id,
      conf: body.conf,
      matchIou: body.matchIou,
      gtGeometry: body.gtGeometry,
      status: ConfidenceReportStatusEnum.PENDING,
      processed: 0,
      total: tasks.length,
      executionName: null,
      errorMessage: null,
      perClassStats: null,
      overallPrecision: null,
      overallRecall: null,
    });

    // Clear inferred regions from the previous run (replacement semantics).
    await this.confidenceReportRepository.clearRegions(report.id);

    // Build the config payload for the job.
    const jobConfig = {
      reportId: report.id,
      projectId,
      modelUrl,
      modelId: model.id,
      conf: body.conf,
      // NMS IoU threshold (duplicate-detection suppression during inference).
      iou: 0.45,
      // TP matching IoU threshold (prediction counts as TP at IoU >= matchIou).
      matchIou: body.matchIou,
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
    if (this.config.mlInferJobName) {
      await this.dispatchViaCloudRunJob(report, jobConfig, this.config.mlInferJobName);
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

    if (report.executionName) {
      try {
        await this.executionsClient.cancelExecution({ name: report.executionName });
        this.logger.log(`Cloud Run execution ${report.executionName} cancel requested`);
      } catch (e) {
        this.logger.error(`Failed cancelling Cloud Run execution ${report.executionName}`, e);
        // Don't re-throw — the report is already marked CANCELLED, so late
        // webhooks will be ignored even if the execution keeps running briefly.
      }
    }
  }

  // ─── Webhook handlers (called by ConfidenceReportWebhookController) ───────

  /**
   * Progress webhook — job sends this every N tasks.
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

    await this.confidenceReportRepository.bulkInsertRegions(
      reportId,
      report.projectId,
      data.taskResults,
    );

    await this.confidenceReportRepository.update(reportId, {
      processed: data.processed,
      total: data.total,
    });
  }

  /**
   * Complete webhook — job sends this once when all tasks are done.
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
      overallPrecision: data.overallPrecision ?? null,
      overallRecall: data.overallRecall ?? null,
      processed: report.total,
    });
  }

  /**
   * Error webhook — job sends this on failure.
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

  private async dispatchViaCloudRunJob(
    report: ConfidenceReportSelect,
    jobConfig: object,
    jobName: string,
  ): Promise<void> {
    const { bucketName } = this.config;

    try {
      // Write config JSON to GCS and mint a signed read URL so the Job
      // container can fetch it without needing bucket IAM (it uses signed URLs).
      const storage = new Storage();
      const bucket = storage.bucket(bucketName);
      const configPath = `confidence-report-configs/${report.id}/${Date.now()}.json`;
      const file = bucket.file(configPath);

      await file.save(JSON.stringify(jobConfig), { contentType: "application/json" });

      const [signedUrl] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + CONFIG_URL_TTL_MS,
      });

      // Trigger a new Cloud Run Job execution with per-run env overrides.
      // CONFIG_URL: signed GCS URL for this run's config JSON.
      // REPORT_ID / WEBHOOK_URL: used by the top-level error handler in
      // batch.py to post an error webhook even if main() crashes before
      // reading the config (e.g. a GCS fetch failure).
      const webhookUrl = `${this.config.apiHost}/v1/confidence-report/webhook`;
      const [operation] = await this.jobsClient.runJob({
        name: jobName,
        overrides: {
          containerOverrides: [
            {
              env: [
                { name: "CONFIG_URL", value: signedUrl },
                { name: "REPORT_ID", value: String(report.id) },
                { name: "WEBHOOK_URL", value: webhookUrl },
              ],
            },
          ],
        },
      });

      // operation.metadata is google.cloud.run.v2.IExecution — set immediately
      // when the LRO is created. We don't await operation.promise() (which only
      // resolves when the execution *finishes*, potentially hours later).
      const executionName = (operation.metadata as { name?: string } | null)?.name ?? null;
      if (executionName) {
        await this.confidenceReportRepository.update(report.id, { executionName });
      } else {
        this.logger.warn(
          `Report ${report.id}: Cloud Run execution name not available in LRO metadata — cancellation will be a no-op`,
        );
      }

      this.logger.log(`Cloud Run Job execution started for report ${report.id}: ${executionName ?? "(name pending)"}`);
    } catch (e) {
      this.logger.error(`Failed starting Cloud Run Job execution for report ${report.id}`, e);
      await this.confidenceReportRepository.update(report.id, {
        status: ConfidenceReportStatusEnum.ERROR,
        errorMessage: "Failed to dispatch Cloud Run Job execution",
      });
      throw e;
    }
  }
}
