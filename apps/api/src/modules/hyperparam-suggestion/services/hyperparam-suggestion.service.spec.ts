import {
  BadGatewayException,
  BadRequestException,
  GatewayTimeoutException,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  ModelBackendEnum,
  ModelOutputTypeEnum,
  ModelQuantizationEnum,
  ProjectTypeEnum,
  type SuggestHyperparamsRequest,
} from "@repo/schema";
import { HyperparamSuggestionService } from "./hyperparam-suggestion.service";

const PROJECT_ID = 1;

const request: SuggestHyperparamsRequest = {
  backend: ModelBackendEnum.ULTRALYTICS,
  taskIds: [],
  labelIds: [10],
  trainingType: ProjectTypeEnum.DETECTION,
  annotationsUsed: [ProjectTypeEnum.DETECTION],
  epochs: 100,
  currentHyperparams: {},
  splitTrain: 70,
  splitValidate: 20,
  splitTest: 10,
  quantization: ModelQuantizationEnum.FP16,
  outputTypes: [ModelOutputTypeEnum.RAW],
  useGroups: false,
};

const validReply = {
  epochs: { value: 150, reasoning: "small dataset" },
  params: {
    model_variant: { value: "yolo11s", reasoning: "fits dataset size" },
    imgsz: { value: 960, reasoning: "small objects" },
  },
  warnings: [
    { severity: "warning", message: "Only 42 images", affectedLabels: ["scratch"] },
    { severity: "info", message: "Split looks fine", affectedLabels: null },
  ],
  summary: "Medium model with more epochs.",
};

const sampledTask = {
  id: 11,
  thumbnailUrl: "https://storage.googleapis.com/bucket/1/thumbnails/a.webp",
  width: 640,
  height: 480,
  rectangleAnnotations: [{ width: 10, height: 10, label: { name: "scratch" } }],
  polygonAnnotations: [],
  classificationAnnotations: [],
};

describe("HyperparamSuggestionService.suggest", () => {
  let geminiClient: { isEnabled: jest.Mock; generateStructured: jest.Mock };
  let analyticsRepository: {
    getSuggestionDatasetStats: jest.Mock;
    getResolutionStats: jest.Mock;
  };
  let taskRepository: {
    getLabelCoverage: jest.Mock;
    getAllByIdsWithAnnotations: jest.Mock;
  };
  let assetsService: { toGsUri: jest.Mock };
  let service: HyperparamSuggestionService;

  beforeEach(() => {
    geminiClient = {
      isEnabled: jest.fn(() => true),
      generateStructured: jest.fn(() => Promise.resolve(JSON.stringify(validReply))),
    };
    analyticsRepository = {
      getSuggestionDatasetStats: jest.fn(() =>
        Promise.resolve({
          labels: [
            {
              labelId: 10,
              name: "scratch",
              color: "#f00",
              instanceCount: 42,
              imageCount: 40,
              minArea: 0.001,
              q1: 0.002,
              median: 0.004,
              q3: 0.01,
              maxArea: 0.05,
            },
          ],
          totalTasks: 50,
          labeledTasks: 40,
        }),
      ),
      getResolutionStats: jest.fn(() =>
        Promise.resolve([{ width: 1920, height: 1080, count: 50 }]),
      ),
    };
    taskRepository = {
      getLabelCoverage: jest.fn(() =>
        Promise.resolve([{ taskId: 11, labelId: 10, count: 3 }]),
      ),
      getAllByIdsWithAnnotations: jest.fn(() => Promise.resolve([sampledTask])),
    };
    assetsService = {
      toGsUri: jest.fn((url: string) =>
        url.replace("https://storage.googleapis.com/bucket/", "gs://bucket/"),
      ),
    };

    service = new HyperparamSuggestionService(
      geminiClient as never,
      analyticsRepository as never,
      taskRepository as never,
      assetsService as never,
    );
  });

  it("maps a valid Gemini reply into the response DTO", async () => {
    const result = await service.suggest(PROJECT_ID, request);

    expect(result.backend).toBe(ModelBackendEnum.ULTRALYTICS);
    expect(result.epochs).toEqual({ value: 150, reasoning: "small dataset" });
    expect(result.params.model_variant).toEqual({
      value: "yolo11s",
      reasoning: "fits dataset size",
    });
    expect(result.params.imgsz.value).toBe(960);
    expect(result.warnings).toEqual([
      { severity: "warning", message: "Only 42 images", affectedLabels: ["scratch"] },
      { severity: "info", message: "Split looks fine", affectedLabels: undefined },
    ]);
    expect(result.summary).toBe("Medium model with more epochs.");
    expect(result.sampledTaskIds).toEqual([11]);
    expect(geminiClient.generateStructured).toHaveBeenCalledTimes(1);
  });

  it("passes gs:// image parts to Gemini", async () => {
    await service.suggest(PROJECT_ID, request);
    const { parts } = geminiClient.generateStructured.mock.calls[0][0];
    const filePart = parts.find(
      (p: Record<string, unknown>) => "fileData" in p,
    );
    expect(filePart.fileData).toEqual({
      fileUri: "gs://bucket/1/thumbnails/a.webp",
      mimeType: "image/webp",
    });
  });

  it("retries once with a corrective part on an invalid reply", async () => {
    geminiClient.generateStructured
      .mockResolvedValueOnce("not json at all")
      .mockResolvedValueOnce(JSON.stringify(validReply));

    const result = await service.suggest(PROJECT_ID, request);

    expect(result.epochs.value).toBe(150);
    expect(geminiClient.generateStructured).toHaveBeenCalledTimes(2);
    const retryParts = geminiClient.generateStructured.mock.calls[1][0].parts;
    const lastPart = retryParts[retryParts.length - 1];
    expect(lastPart.text).toContain("previous reply was invalid");
  });

  it("rejects out-of-range values via the registry schema and 502s after two failures", async () => {
    const badReply = {
      ...validReply,
      params: { imgsz: { value: 99999, reasoning: "too big" } },
    };
    geminiClient.generateStructured.mockResolvedValue(JSON.stringify(badReply));

    await expect(service.suggest(PROJECT_ID, request)).rejects.toThrow(
      BadGatewayException,
    );
    expect(geminiClient.generateStructured).toHaveBeenCalledTimes(2);
  });

  it("returns 503 when Gemini is not configured", async () => {
    geminiClient.isEnabled.mockReturnValue(false);
    await expect(service.suggest(PROJECT_ID, request)).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it("rejects backends without a registry entry", async () => {
    await expect(
      service.suggest(PROJECT_ID, { ...request, backend: ModelBackendEnum.LUXONIS }),
    ).rejects.toThrow(BadRequestException);
  });

  it("maps SDK errors to 502 and timeouts to 504", async () => {
    geminiClient.generateStructured.mockRejectedValue(new Error("boom"));
    await expect(service.suggest(PROJECT_ID, request)).rejects.toThrow(
      BadGatewayException,
    );

    geminiClient.generateStructured.mockRejectedValue(
      new Error("request timed out"),
    );
    await expect(service.suggest(PROJECT_ID, request)).rejects.toThrow(
      GatewayTimeoutException,
    );
  });
});
