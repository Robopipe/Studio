import {
  ModelBackendEnum,
  ModelOutputTypeEnum,
  ModelQuantizationEnum,
  ProjectTypeEnum,
  type SuggestHyperparamsRequest,
} from "@repo/schema";
import type { TaskDetailEntity } from "../../task/entity/task.entity";
import {
  buildAnnotationSummary,
  buildContents,
  buildSystemInstruction,
  type SuggestionPromptInput,
} from "./prompt-builder";

const request: SuggestHyperparamsRequest = {
  backend: ModelBackendEnum.ULTRALYTICS,
  taskIds: [1, 2],
  labelIds: [10],
  trainingType: ProjectTypeEnum.DETECTION,
  annotationsUsed: [ProjectTypeEnum.DETECTION],
  epochs: 100,
  currentHyperparams: { model_variant: "yolo11l", imgsz: 1280 },
  splitTrain: 70,
  splitValidate: 20,
  splitTest: 10,
  quantization: ModelQuantizationEnum.FP16,
  outputTypes: [ModelOutputTypeEnum.RAW],
  useGroups: false,
};

const promptInput: SuggestionPromptInput = {
  request,
  stats: {
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
  },
  resolutions: [{ width: 1920, height: 1080, count: 50 }],
  images: [
    {
      gsUri: "gs://bucket/1/thumbnails/a.webp",
      mimeType: "image/webp",
      summary: "Image 640x480px: 2x scratch boxes",
    },
  ],
  uncoveredLabelNames: ["dent"],
};

describe("buildSystemInstruction", () => {
  it("forbids suggesting batch and changing fixed constraints", () => {
    const instruction = buildSystemInstruction();
    expect(instruction).toContain("Never suggest `batch`");
    expect(instruction).toContain("must not be changed");
    expect(instruction).toContain("base model_variant names");
  });

  it("asks for a dataset split summing to 100", () => {
    const instruction = buildSystemInstruction();
    expect(instruction).toContain("sum to exactly 100");
    expect(instruction).not.toContain("dataset split, quantization");
  });
});

describe("buildContents", () => {
  it("includes the fixed constraints and current values", () => {
    const texts = buildContents(promptInput)
      .map((p) => ("text" in p ? p.text : ""))
      .join("\n");
    expect(texts).toContain("FIXED constraints");
    expect(texts).toContain("70% train / 20% validation / 10% test");
    expect(texts).toContain('"model_variant":"yolo11l"');
    expect(texts).toContain("Epochs: 100");
  });

  it("lists the dataset split as user-editable, not FIXED", () => {
    const texts = buildContents(promptInput)
      .map((p) => ("text" in p ? p.text : ""))
      .join("\n");
    const fixedIndex = texts.indexOf("FIXED constraints");
    const editableIndex = texts.indexOf("Current user-editable values");
    const splitIndex = texts.indexOf("Dataset split:");
    expect(fixedIndex).toBeGreaterThanOrEqual(0);
    expect(splitIndex).toBeGreaterThan(editableIndex);
    expect(texts.slice(fixedIndex, editableIndex)).not.toContain(
      "Dataset split",
    );
  });

  it("embeds the dataset analytics and uncovered labels", () => {
    const texts = buildContents(promptInput)
      .map((p) => ("text" in p ? p.text : ""))
      .join("\n");
    expect(texts).toContain("40/50");
    expect(texts).toContain("1920x1080 (50x)");
    expect(texts).toContain('"instanceCount":42');
    expect(texts).toContain("WITHOUT any annotated example: dent");
  });

  it("places each image summary directly before its fileData part", () => {
    const parts = buildContents(promptInput);
    const fileIndex = parts.findIndex((p) => "fileData" in p);
    expect(fileIndex).toBeGreaterThan(0);
    const filePart = parts[fileIndex] as {
      fileData: { fileUri: string; mimeType: string };
    };
    expect(filePart.fileData.fileUri).toBe("gs://bucket/1/thumbnails/a.webp");
    expect(filePart.fileData.mimeType).toBe("image/webp");
    const before = parts[fileIndex - 1] as { text: string };
    expect(before.text).toBe("Image 640x480px: 2x scratch boxes");
  });

  it("notes when no example images are available", () => {
    const parts = buildContents({ ...promptInput, images: [] });
    expect(parts.some((p) => "fileData" in p)).toBe(false);
    const texts = parts.map((p) => ("text" in p ? p.text : "")).join("\n");
    expect(texts).toContain("No annotated images available");
  });
});

describe("buildAnnotationSummary", () => {
  const task = {
    width: 640,
    height: 480,
    // Rect w/h are 0-100 percent of the image; area% = (w*h)/100.
    rectangleAnnotations: [
      { width: 2, height: 2, label: { name: "scratch" } }, // 0.04% -> tiny
      { width: 30, height: 40, label: { name: "scratch" } }, // 12% -> medium
    ],
    polygonAnnotations: [{ label: { name: "dent" } }],
    classificationAnnotations: [{ label: { name: "defective" } }],
  } as unknown as TaskDetailEntity;

  it("summarizes counts, size buckets, polygons and classifications", () => {
    const summary = buildAnnotationSummary(task);
    expect(summary).toContain("Image 640x480px");
    expect(summary).toContain('2x "scratch" boxes');
    expect(summary).toContain("1 tiny (<1% of image)");
    expect(summary).toContain("1 medium (5-25%)");
    expect(summary).toContain('1x "dent" polygons');
    expect(summary).toContain('classified as "defective"');
  });

  it("handles unannotated tasks", () => {
    const empty = {
      width: 100,
      height: 100,
      rectangleAnnotations: [],
      polygonAnnotations: [],
      classificationAnnotations: [],
    } as unknown as TaskDetailEntity;
    expect(buildAnnotationSummary(empty)).toContain("no annotations");
  });
});
