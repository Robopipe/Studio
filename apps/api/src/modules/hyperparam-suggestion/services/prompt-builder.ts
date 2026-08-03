import type { SuggestHyperparamsRequest } from "@repo/schema";
import type {
  ResolutionStatRow,
  SuggestionDatasetStats,
} from "../../../repository/services/analytics-repository.service";
import type { TaskDetailEntity } from "../../task/entity/task.entity";

export interface ExampleImage {
  gsUri: string;
  mimeType: string;
  summary: string;
}

export interface SuggestionPromptInput {
  request: SuggestHyperparamsRequest;
  stats: SuggestionDatasetStats;
  resolutions: ResolutionStatRow[];
  images: ExampleImage[];
  /** Names of active labels with no annotated example in scope */
  uncoveredLabelNames: string[];
}

/** A prompt part — structurally compatible with @google/genai PartUnion */
export type PromptPart =
  | { text: string }
  | { fileData: { fileUri: string; mimeType: string } };

export const buildSystemInstruction = (): string =>
  [
    "You are an expert in training Ultralytics YOLO models for industrial machine-vision quality inspection.",
    "Given a training setup, dataset analytics, and a few example images, suggest the best training hyperparameters, epoch count, and dataset split, and flag dataset problems.",
    "",
    "Hard rules:",
    "- Suggest ONLY the parameters in the response schema, plus epochs and the dataset split. Never suggest `batch` — it is auto-sized server-side.",
    "- Return base model_variant names (e.g. yolo11m); the task suffix (-seg/-cls) is applied automatically.",
    "- The training setup marked as FIXED (training type, label/task selection, quantization, output formats, groups) must not be changed. If a fixed setting is problematic, add a warning about it instead.",
    "- Suggest a train/validation/test dataset split as integer percentages that sum to exactly 100. Small datasets may use test = 0; prefer keeping the current split when it is already sensible.",
    "- Omit a parameter when its Ultralytics default is already the right choice; suggest values only where they matter for this dataset.",
    "- Give exactly one short sentence of reasoning per suggested value.",
    "- Derive `warnings` from the analytics and images: too few images overall or per label (a good model usually needs 100+ annotated examples per label), strong class imbalance, labels without any examples, tiny objects relative to the chosen image size, epochs mismatched to dataset size, and anything else that risks a poor model. Use severity critical only when training would likely fail or be unusable.",
    "- Warning messages are shown to end users — keep them actionable and free of jargon.",
  ].join("\n");

const AREA_BUCKETS: Array<{ max: number; name: string }> = [
  { max: 1, name: "tiny (<1% of image)" },
  { max: 5, name: "small (1-5%)" },
  { max: 25, name: "medium (5-25%)" },
  { max: Infinity, name: "large (>25%)" },
];

/**
 * One-line annotation summary for an example image. Rectangle x/y/w/h are in
 * 0-100 percent space, so box area as % of image = (w * h) / 100.
 */
export const buildAnnotationSummary = (task: TaskDetailEntity): string => {
  const parts: string[] = [];

  const rectsByLabel = new Map<string, number[]>();
  for (const rect of task.rectangleAnnotations) {
    const areas = rectsByLabel.get(rect.label.name) ?? [];
    areas.push((rect.width * rect.height) / 100);
    rectsByLabel.set(rect.label.name, areas);
  }
  for (const [label, areas] of rectsByLabel) {
    const buckets = new Map<string, number>();
    for (const area of areas) {
      const bucket = AREA_BUCKETS.find((b) => area <= b.max)?.name ?? "large";
      buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
    }
    const bucketText = [...buckets]
      .map(([name, count]) => `${count} ${name}`)
      .join(", ");
    parts.push(`${areas.length}x "${label}" boxes: ${bucketText}`);
  }

  const polysByLabel = new Map<string, number>();
  for (const poly of task.polygonAnnotations) {
    polysByLabel.set(poly.label.name, (polysByLabel.get(poly.label.name) ?? 0) + 1);
  }
  for (const [label, count] of polysByLabel) {
    parts.push(`${count}x "${label}" polygons`);
  }

  if (task.classificationAnnotations.length > 0) {
    const names = task.classificationAnnotations.map((c) => `"${c.label.name}"`);
    parts.push(`classified as ${names.join(", ")}`);
  }

  const annotations = parts.length > 0 ? parts.join("; ") : "no annotations";
  return `Image ${task.width}x${task.height}px: ${annotations}`;
};

export const buildContents = (input: SuggestionPromptInput): PromptPart[] => {
  const { request, stats, resolutions, images, uncoveredLabelNames } = input;

  const setup = [
    "## Training setup",
    "FIXED constraints (do not change; warn if problematic):",
    `- Training type: ${request.trainingType}`,
    `- Annotation types used: ${request.annotationsUsed.join(", ")}`,
    `- Quantization: ${request.quantization}`,
    `- Output formats: ${request.outputTypes.join(", ") || "(none selected)"}`,
    `- Instance grouping: ${request.useGroups ? "enabled" : "disabled"}`,
    "",
    "Current user-editable values (your suggestions replace these):",
    `- Epochs: ${request.epochs ?? "(not set)"}`,
    `- Dataset split: ${request.splitTrain}% train / ${request.splitValidate}% validation / ${request.splitTest}% test`,
    `- Hyperparameters: ${JSON.stringify(request.currentHyperparams)}`,
  ].join("\n");

  const analytics = [
    "## Dataset analytics",
    `Images in the selected dataset (annotated/total): ${stats.labeledTasks}/${stats.totalTasks}`,
    `Most common image resolutions: ${
      resolutions.map((r) => `${r.width}x${r.height} (${r.count}x)`).join(", ") ||
      "(none)"
    }`,
    uncoveredLabelNames.length > 0
      ? `Labels selected for training but WITHOUT any annotated example: ${uncoveredLabelNames.join(", ")}`
      : "",
    "Per-label statistics (area values are the annotation's fraction of the image area, 0-1):",
    JSON.stringify(
      stats.labels.map((l) => ({
        label: l.name,
        instanceCount: l.instanceCount,
        imageCount: l.imageCount,
        area:
          l.median != null
            ? { min: l.minArea, q1: l.q1, median: l.median, q3: l.q3, max: l.maxArea }
            : null,
      })),
    ),
  ]
    .filter(Boolean)
    .join("\n");

  const parts: PromptPart[] = [{ text: setup }, { text: analytics }];

  if (images.length > 0) {
    parts.push({
      text: `## Example images (${images.length} sampled to cover every label)`,
    });
    for (const image of images) {
      parts.push({ text: image.summary });
      parts.push({
        fileData: { fileUri: image.gsUri, mimeType: image.mimeType },
      });
    }
  } else {
    parts.push({
      text: "## Example images\nNo annotated images available to show.",
    });
  }

  parts.push({
    text: "Suggest the best training configuration for this dataset and list any dataset warnings. Respond with the JSON object only.",
  });

  return parts;
};
