import { HttpService } from "@nestjs/axios";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  MlInferPredictRequest,
  MlInferPredictResponse,
  ModelOutputTypeEnum,
  ModelStatusEnum,
  PredictResponse,
} from "@repo/schema";
import { firstValueFrom } from "rxjs";
import { AppConfig } from "../../../core/configuration/app.config";
import { AssetsService } from "../../assets/services/assets.service";
import { ModelOutputRepository } from "../../../repository/services/model-output-repository.service";
import { ModelRepository } from "../../../repository/services/model-repository.service";
import { TaskRepository } from "../../../repository/services/task-repository.service";
import { PredictRequestDto } from "../dto/predict.dto";

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
    body: PredictRequestDto,
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

    // Per product decision: pre-annotate is only allowed on empty tasks
    // so we don't have to merge predictions with the user's in-progress
    // edits or auto-overwrite real annotations.
    const existingCount =
      (task.rectangleAnnotations?.length ?? 0) +
      (task.polygonAnnotations?.length ?? 0) +
      (task.classificationAnnotations?.length ?? 0);
    if (existingCount > 0) {
      throw new ConflictException(
        "task already has annotations; pre-annotation is only allowed on empty tasks",
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

    const payload: MlInferPredictRequest = {
      imageUrl,
      modelUrl,
      modelId: model.id,
      ...(body.conf !== undefined ? { conf: body.conf } : {}),
      ...(body.iou !== undefined ? { iou: body.iou } : {}),
      ...(body.polyEpsilon !== undefined
        ? { polyEpsilon: body.polyEpsilon }
        : {}),
    };

    const response = await firstValueFrom(
      this.http.post<MlInferPredictResponse>(
        `${this.config.mlInferUrl.replace(/\/$/, "")}/predict`,
        payload,
        {
          headers: { Authorization: this.config.mlInferApiKey },
          timeout: 60_000,
        },
      ),
    );

    // model.labels is ordered by labelId ASC (see ModelRepository
    // getByIdAndProjectId); index = classIndex from the ONNX head.
    const labelIds = model.labels.map((l) => l.id);
    const polygons = response.data.polygons.flatMap((p) => {
      const labelId = labelIds[p.classIndex];
      if (labelId === undefined) return [];
      return [{ labelId, score: p.score, value: p.value }];
    });

    return { polygons };
  }
}
