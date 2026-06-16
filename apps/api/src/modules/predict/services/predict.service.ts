import { HttpService } from "@nestjs/axios";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  MlInferDetectRequest,
  MlInferDetectResponse,
  MlInferPredictRequest,
  MlInferPredictResponse,
  ModelOutputTypeEnum,
  ModelStatusEnum,
  PreAnnotateModelTypeEnum,
  PredictRequest,
  ProjectTypeEnum,
  PredictResponse,
} from "@repo/schema";
import { firstValueFrom } from "rxjs";
import { AppConfig } from "../../../core/configuration/app.config";
import { AssetsService } from "../../assets/services/assets.service";
import { ModelOutputRepository } from "../../../repository/services/model-output-repository.service";
import { ModelRepository } from "../../../repository/services/model-repository.service";
import { TaskRepository } from "../../../repository/services/task-repository.service";

@Injectable()
export class PredictService {
  constructor(
    private readonly http: HttpService,
    private readonly config: AppConfig,
    private readonly assetsService: AssetsService,
    private readonly modelRepository: ModelRepository,
    private readonly modelOutputRepository: ModelOutputRepository,
    private readonly taskRepository: TaskRepository,
  ) {}

  public async predict(
    projectId: number,
    taskId: number,
    body: PredictRequest,
  ): Promise<PredictResponse> {
    if (!this.config.mlInferUrl) {
      throw new ServiceUnavailableException(
        "ml-infer service URL is not configured",
      );
    }

    const task = await this.taskRepository.getByIdAndProjectIdOrThrow(
      taskId,
      projectId,
    );

    // Per-geometry empty-task precondition: only block the geometry type
    // being predicted, so a task with polygons can still receive detection
    // boxes (and vice-versa). Classifications are always ignored.
    const isDetection = body.modelType === PreAnnotateModelTypeEnum.DETECTION;
    const conflictingCount = isDetection
      ? (task.rectangleAnnotations?.length ?? 0)
      : (task.polygonAnnotations?.length ?? 0);
    if (conflictingCount > 0) {
      throw new ConflictException(
        isDetection
          ? "task already has rectangle annotations; detection pre-annotation is only allowed when no rectangles exist"
          : "task already has polygon annotations; segmentation pre-annotation is only allowed when no polygons exist",
      );
    }

    const model = await this.modelRepository.getByIdAndProjectId(
      body.modelId,
      projectId,
    );
    if (!model) {
      throw new NotFoundException("model not found in this project");
    }
    if (model.status !== ModelStatusEnum.DONE) {
      throw new BadRequestException(
        `model status must be DONE, got ${model.status}`,
      );
    }
    if (model.labels.length === 0) {
      throw new BadRequestException(
        "model has no labels recorded; cannot map predictions",
      );
    }
    if (model.trainingType === ProjectTypeEnum.CLASSIFICATION) {
      throw new BadRequestException(
        "classification models cannot be used for pre-annotation",
      );
    }
    if (
      isDetection &&
      model.trainingType !== ProjectTypeEnum.DETECTION
    ) {
      throw new BadRequestException(
        "detection pre-annotation requires a detection model",
      );
    }
    if (
      !isDetection &&
      model.trainingType !== ProjectTypeEnum.SEGMENTATION
    ) {
      throw new BadRequestException(
        "segmentation pre-annotation requires a segmentation model",
      );
    }

    // ModelOutputTypeEnum.RAW is the onnx.tar.xz buffer (despite the
    // name — see packages/database/src/schema/entities/model-output.ts).
    // ml-infer's loader handles both raw ONNX and the NN-archive form.
    const outputs = await this.modelOutputRepository.getAllByModelId(model.id);
    const rawOutput = outputs.find(
      (o) => o.type === ModelOutputTypeEnum.RAW,
    );
    if (!rawOutput) {
      throw new NotFoundException(
        "model has no RAW output; retrain or wait for export to finish",
      );
    }

    const [imageUrl, modelUrl] = await Promise.all([
      this.assetsService.generateSignedDownloadUrl(task.filePath),
      this.assetsService.generateSignedDownloadUrl(rawOutput.filePath),
    ]);

    // model.labels is ordered by labelId ASC (see ModelRepository
    // getByIdAndProjectId); index = classIndex from the ONNX head.
    const labelIds = model.labels.map((l) => l.id);
    const mlInferBase = this.config.mlInferUrl.replace(/\/$/, "");
    const widthDivisor = task.width || 1;
    const heightDivisor = task.height || 1;

    if (isDetection) {
      const payload: MlInferDetectRequest = {
        imageUrl,
        modelUrl,
        modelId: model.id,
        ...(body.conf !== undefined ? { conf: body.conf } : {}),
        ...(body.iou !== undefined ? { iou: body.iou } : {}),
        ...(body.minAreaPx !== undefined ? { minAreaPx: body.minAreaPx } : {}),
      };

      const response = await firstValueFrom(
        this.http.post<MlInferDetectResponse>(
          `${mlInferBase}/predict/detection`,
          payload,
          {
            headers: { Authorization: this.config.mlInferApiKey },
            timeout: 60_000,
          },
        ),
      );

      // ml-infer returns box coords in original-image pixel coords.
      // Convert to percentages so the web canvas renders correctly.
      const rectangles = response.data.rectangles.flatMap((r) => {
        const labelId = labelIds[r.classIndex];
        if (labelId === undefined) return [];
        return [
          {
            labelId,
            score: r.score,
            x: (r.x / widthDivisor) * 100,
            y: (r.y / heightDivisor) * 100,
            width: (r.width / widthDivisor) * 100,
            height: (r.height / heightDivisor) * 100,
          },
        ];
      });

      return { modelType: PreAnnotateModelTypeEnum.DETECTION, rectangles };
    }

    // Segmentation path (body.modelType === SEGMENTATION, narrowed by the
    // isDetection branch above returning early)
    if (body.modelType !== PreAnnotateModelTypeEnum.SEGMENTATION) {
      throw new BadRequestException("unsupported model type for pre-annotation");
    }
    const fillConcavityClasses = body.fillConcavityLabelIds
      ?.map((id) => labelIds.indexOf(id))
      .filter((idx) => idx >= 0);

    const payload: MlInferPredictRequest = {
      imageUrl,
      modelUrl,
      modelId: model.id,
      ...(body.conf !== undefined ? { conf: body.conf } : {}),
      ...(body.iou !== undefined ? { iou: body.iou } : {}),
      ...(body.polyEpsilon !== undefined ? { polyEpsilon: body.polyEpsilon } : {}),
      ...(body.maskThreshold !== undefined ? { maskThreshold: body.maskThreshold } : {}),
      ...(body.minAreaPx !== undefined ? { minAreaPx: body.minAreaPx } : {}),
      ...(fillConcavityClasses && fillConcavityClasses.length > 0
        ? { fillConcavityClasses }
        : {}),
    };

    const response = await firstValueFrom(
      this.http.post<MlInferPredictResponse>(
        `${mlInferBase}/predict/segmentation`,
        payload,
        {
          headers: { Authorization: this.config.mlInferApiKey },
          timeout: 60_000,
        },
      ),
    );

    // ml-infer returns polygon vertices in original-image pixel coords.
    // Convert to percentages.
    const polygons = response.data.polygons.flatMap((p) => {
      const labelId = labelIds[p.classIndex];
      if (labelId === undefined) return [];
      const value = p.value.map(
        ([x, y]) =>
          [(x / widthDivisor) * 100, (y / heightDivisor) * 100] as [
            number,
            number,
          ],
      );
      return [{ labelId, score: p.score, value }];
    });

    return { modelType: PreAnnotateModelTypeEnum.SEGMENTATION, polygons };
  }
}
