import {
  BadGatewayException,
  BadRequestException,
  GatewayTimeoutException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  getGeminiSuggestionSchema,
  HYPERPARAM_SUGGESTION_REGISTRY,
  ProjectTypeEnum,
  type AnnotationType,
  type GeminiSuggestion,
  type SuggestedParam,
  type SuggestHyperparamsRequest,
  type SuggestHyperparamsResponse,
} from "@repo/schema";
import z from "zod";
import { AnalyticsRepository } from "../../../repository/services/analytics-repository.service";
import { TaskRepository } from "../../../repository/services/task-repository.service";
import { AssetsService } from "../../assets/services/assets.service";
import { GeminiClientService } from "./gemini-client.service";
import { sampleLabelCoveringTasks } from "./image-sampler";
import {
  buildAnnotationSummary,
  buildContents,
  buildSystemInstruction,
  type ExampleImage,
  type PromptPart,
} from "./prompt-builder";

const MAX_EXAMPLE_IMAGES = 10;

@Injectable()
export class HyperparamSuggestionService {
  private readonly logger = new Logger(HyperparamSuggestionService.name);

  constructor(
    private readonly geminiClient: GeminiClientService,
    private readonly analyticsRepository: AnalyticsRepository,
    private readonly taskRepository: TaskRepository,
    private readonly assetsService: AssetsService,
  ) {}

  public async suggest(
    projectId: number,
    data: SuggestHyperparamsRequest,
  ): Promise<SuggestHyperparamsResponse> {
    if (!this.geminiClient.isEnabled()) {
      throw new ServiceUnavailableException(
        "AI suggestions are not configured (GCP_PROJECT missing)",
      );
    }
    if (!HYPERPARAM_SUGGESTION_REGISTRY[data.backend]) {
      throw new BadRequestException(
        `AI suggestions are not supported for the ${data.backend} backend`,
      );
    }

    const types = this.toAnnotationTypes(data.trainingType, data.annotationsUsed);

    const [stats, resolutions, coverage] = await Promise.all([
      this.analyticsRepository.getSuggestionDatasetStats(projectId, {
        taskIds: data.taskIds,
        types,
      }),
      this.analyticsRepository.getResolutionStats(projectId, data.taskIds),
      this.taskRepository.getLabelCoverage(projectId, data.taskIds, types),
    ]);

    const labelNameById = new Map(stats.labels.map((l) => [l.labelId, l.name]));
    const activeLabelIds = data.labelIds.length
      ? data.labelIds
      : stats.labels.map((l) => l.labelId);
    const activeLabelSet = new Set(activeLabelIds);

    const sample = sampleLabelCoveringTasks(
      coverage,
      activeLabelIds,
      MAX_EXAMPLE_IMAGES,
    );
    const tasks = await this.taskRepository.getAllByIdsWithAnnotations(
      sample.taskIds,
      projectId,
    );
    const images: ExampleImage[] = tasks.map((task) => ({
      gsUri: this.assetsService.toGsUri(task.thumbnailUrl),
      mimeType: "image/webp",
      summary: buildAnnotationSummary(task),
    }));

    const parts = buildContents({
      request: data,
      stats: {
        ...stats,
        labels: stats.labels.filter((l) => activeLabelSet.has(l.labelId)),
      },
      resolutions,
      images,
      uncoveredLabelNames: sample.uncoveredLabelIds
        .map((id) => labelNameById.get(id))
        .filter((name): name is string => Boolean(name)),
    });

    const suggestion = await this.generateSuggestion(data, parts);

    return {
      backend: data.backend,
      epochs: suggestion.epochs,
      params: this.mapParams(suggestion),
      warnings: suggestion.warnings.map((w) => ({
        severity: w.severity,
        message: w.message,
        affectedLabels: w.affectedLabels ?? undefined,
      })),
      summary: suggestion.summary,
      sampledTaskIds: tasks.map((t) => t.id),
    };
  }

  /**
   * Call Gemini with structured output; validate the reply against the same
   * zod schema the JSON schema was derived from. One corrective retry with
   * the validation errors appended, then 502.
   */
  private async generateSuggestion(
    data: SuggestHyperparamsRequest,
    parts: PromptPart[],
  ): Promise<GeminiSuggestion> {
    const schema = getGeminiSuggestionSchema(data.backend);
    const responseJsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
    const systemInstruction = buildSystemInstruction();

    let currentParts = parts;
    for (let attempt = 0; attempt < 2; attempt++) {
      let text: string;
      try {
        text = await this.geminiClient.generateStructured({
          systemInstruction,
          parts: currentParts,
          responseJsonSchema,
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        this.logger.error(`Gemini request failed: ${message}`);
        if (/timeout|timed out|aborted/i.test(message)) {
          throw new GatewayTimeoutException("AI suggestion timed out");
        }
        throw new BadGatewayException("AI suggestion failed");
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }
      const result = schema.safeParse(parsed);
      if (result.success) {
        return result.data;
      }

      this.logger.warn(
        `Gemini reply failed validation (attempt ${attempt + 1}): ${z.prettifyError(result.error)}`,
      );
      currentParts = [
        ...parts,
        {
          text: `Your previous reply was invalid: ${
            parsed === null ? "not valid JSON" : z.prettifyError(result.error)
          }. Respond again with a JSON object matching the schema exactly.`,
        },
      ];
    }

    throw new BadGatewayException("AI suggestion returned an invalid response");
  }

  private mapParams(
    suggestion: GeminiSuggestion,
  ): Record<string, SuggestedParam> {
    const params: Record<string, SuggestedParam> = {};
    for (const [name, suggested] of Object.entries(suggestion.params)) {
      if (suggested) {
        params[name] = suggested;
      }
    }
    return params;
  }

  private toAnnotationTypes(
    trainingType: ProjectTypeEnum,
    annotationsUsed: ProjectTypeEnum[],
  ): AnnotationType[] {
    switch (trainingType) {
      case ProjectTypeEnum.CLASSIFICATION:
        return ["classification"];
      case ProjectTypeEnum.SEGMENTATION:
        return ["polygon"];
      case ProjectTypeEnum.DETECTION: {
        const types: AnnotationType[] = [];
        if (annotationsUsed.includes(ProjectTypeEnum.DETECTION)) {
          types.push("rectangle");
        }
        if (annotationsUsed.includes(ProjectTypeEnum.SEGMENTATION)) {
          types.push("polygon");
        }
        return types.length > 0 ? types : ["rectangle"];
      }
    }
  }
}
