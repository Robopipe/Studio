import z from "zod";
import { ModelBackendEnum } from "../model.schema";

export type SuggestibleParamInput = "number" | "integer" | "boolean" | "enum";

/**
 * One suggestible hyperparameter. A single definition drives three consumers:
 * the Gemini structured-output schema (via `description`/ranges), API-side
 * validation of Gemini's reply, and the web review dialog's typed inputs.
 */
export interface SuggestibleParamDef {
  /** UI display name, e.g. "Initial learning rate" */
  label: string;
  /** Meaning + tuning guidance — becomes the JSON-schema description Gemini sees */
  description: string;
  input: SuggestibleParamInput;
  min?: number;
  max?: number;
  /** UI-only: NumberInput step */
  step?: number;
  /** enum inputs: allowed values (zod enum + Select options) */
  options?: readonly string[];
}

export interface HyperparamRegistryEntry {
  /** Insertion order = review-dialog display order */
  params: Record<string, SuggestibleParamDef>;
  /** All params optional — validates values applied by the user/Gemini */
  paramsSchema: z.ZodType<Record<string, unknown>>;
}

export const buildParamValueSchema = (
  def: SuggestibleParamDef,
): z.ZodType<string | number | boolean> => {
  let schema: z.ZodType<string | number | boolean>;
  switch (def.input) {
    case "enum":
      schema = z.enum((def.options ?? []) as [string, ...string[]]);
      break;
    case "boolean":
      schema = z.boolean();
      break;
    case "integer": {
      let num = z.number().int();
      if (def.min !== undefined) num = num.min(def.min);
      if (def.max !== undefined) num = num.max(def.max);
      schema = num;
      break;
    }
    case "number": {
      let num = z.number();
      if (def.min !== undefined) num = num.min(def.min);
      if (def.max !== undefined) num = num.max(def.max);
      schema = num;
      break;
    }
  }
  return schema.describe(def.description);
};

const buildParamsSchema = (
  params: Record<string, SuggestibleParamDef>,
): z.ZodType<Record<string, unknown>> =>
  z.object(
    Object.fromEntries(
      Object.entries(params).map(([name, def]) => [
        name,
        buildParamValueSchema(def).optional(),
      ]),
    ),
  );

export const defineRegistryEntry = (
  params: Record<string, SuggestibleParamDef>,
): HyperparamRegistryEntry => ({
  params,
  paramsSchema: buildParamsSchema(params),
});

// Suggestible keys for the Ultralytics backend — the intersection of what the
// web presets use (AdvancedSettings/presets.ts) and what ml-yolo passes through
// to YOLO.train() (apps/ml-yolo/app/ml/ultralytics_config.py). `batch` is
// excluded (auto-sized server-side) and `epochs` is a dedicated form field.
const ULTRALYTICS_SUGGESTIBLE_PARAMS: Record<string, SuggestibleParamDef> = {
  model_variant: {
    label: "Model variant",
    description:
      "YOLO11 architecture size: n (2.6M params, fastest, edge-friendly), s (9.4M), m (20M), l (25M), x (57M, most accurate). Larger variants overfit small datasets — prefer n/s below ~500 images, m for ~500-2000, l/x only for large diverse datasets. Always return the base name; the task suffix (-seg/-cls) is applied automatically.",
    input: "enum",
    options: ["yolo11n", "yolo11s", "yolo11m", "yolo11l", "yolo11x"],
  },
  imgsz: {
    label: "Image size",
    description:
      "Training image size in pixels (square, multiple of 32). 640 is the standard default; raise to 960-1280 when objects are small relative to the image (check the per-label area statistics). Higher sizes cost memory and time.",
    input: "integer",
    min: 320,
    max: 1920,
    step: 32,
  },
  optimizer: {
    label: "Optimizer",
    description:
      "AdamW is a robust default for small/medium datasets; SGD can generalize better on large datasets; 'auto' lets Ultralytics pick per dataset size.",
    input: "enum",
    options: ["SGD", "Adam", "AdamW", "auto"],
  },
  lr0: {
    label: "Initial learning rate",
    description:
      "Initial learning rate. Typical: 0.001 with AdamW/Adam, 0.01 with SGD. Use the lower end when fine-tuning on small datasets.",
    input: "number",
    min: 0.00001,
    max: 0.1,
    step: 0.0001,
  },
  lrf: {
    label: "Final LR fraction",
    description:
      "Final learning rate as a fraction of lr0 (schedule ends at lr0*lrf). Typical 0.01.",
    input: "number",
    min: 0.0001,
    max: 1,
    step: 0.001,
  },
  momentum: {
    label: "Momentum",
    description: "SGD momentum / Adam beta1. Typical 0.937.",
    input: "number",
    min: 0.6,
    max: 0.999,
    step: 0.001,
  },
  weight_decay: {
    label: "Weight decay",
    description:
      "L2 regularization strength. Typical 0.0005; nudge up to fight overfitting on small datasets.",
    input: "number",
    min: 0,
    max: 0.01,
    step: 0.0001,
  },
  cos_lr: {
    label: "Cosine LR schedule",
    description:
      "Use a cosine learning-rate schedule instead of linear decay — usually smoother convergence.",
    input: "boolean",
  },
  warmup_epochs: {
    label: "Warmup epochs",
    description:
      "Epochs of learning-rate warmup at the start of training. Typical 3-5.",
    input: "number",
    min: 0,
    max: 20,
    step: 0.5,
  },
  warmup_momentum: {
    label: "Warmup momentum",
    description: "Initial momentum during warmup, ramped to `momentum`. Typical 0.8.",
    input: "number",
    min: 0,
    max: 0.95,
    step: 0.01,
  },
  warmup_bias_lr: {
    label: "Warmup bias LR",
    description: "Bias learning rate during warmup. Typical 0.1.",
    input: "number",
    min: 0,
    max: 0.2,
    step: 0.01,
  },
  patience: {
    label: "Early-stopping patience",
    description:
      "Epochs without validation improvement before early stopping. Scale with total epochs (roughly a third to a half).",
    input: "integer",
    min: 0,
    max: 300,
  },
  box: {
    label: "Box loss weight",
    description:
      "Box regression loss weight (detection/segmentation). Default 7.5; raise when localization is the main error mode.",
    input: "number",
    min: 0,
    max: 20,
    step: 0.5,
  },
  cls: {
    label: "Class loss weight",
    description:
      "Classification loss weight. Default 0.5; raise when classes are confused with each other.",
    input: "number",
    min: 0,
    max: 10,
    step: 0.1,
  },
  dfl: {
    label: "DFL loss weight",
    description: "Distribution focal loss weight. Default 1.5.",
    input: "number",
    min: 0,
    max: 10,
    step: 0.1,
  },
  mosaic: {
    label: "Mosaic",
    description:
      "Mosaic augmentation probability. Strong regularizer; lower (0.3-0.7) or disable for small datasets, uniform industrial scenes, or when scene context matters.",
    input: "number",
    min: 0,
    max: 1,
    step: 0.05,
  },
  close_mosaic: {
    label: "Close mosaic",
    description:
      "Disable mosaic for the final N epochs so the model fine-tunes on undistorted images. Typical 10-15.",
    input: "integer",
    min: 0,
    max: 50,
  },
  mixup: {
    label: "Mixup",
    description:
      "Mixup augmentation probability. Small values (0.1-0.15) help large datasets; skip for small ones.",
    input: "number",
    min: 0,
    max: 1,
    step: 0.05,
  },
  copy_paste: {
    label: "Copy-paste",
    description:
      "Copy-paste augmentation probability (needs segmentation masks). Helps rare classes in segmentation datasets.",
    input: "number",
    min: 0,
    max: 1,
    step: 0.05,
  },
  hsv_h: {
    label: "HSV hue jitter",
    description:
      "Hue augmentation fraction. Keep near 0 when color discriminates classes or lighting is controlled (industrial). Default 0.015.",
    input: "number",
    min: 0,
    max: 1,
    step: 0.005,
  },
  hsv_s: {
    label: "HSV saturation jitter",
    description: "Saturation augmentation fraction. Default 0.7.",
    input: "number",
    min: 0,
    max: 1,
    step: 0.05,
  },
  hsv_v: {
    label: "HSV value jitter",
    description:
      "Brightness augmentation fraction. Default 0.4; lower under controlled lighting.",
    input: "number",
    min: 0,
    max: 1,
    step: 0.05,
  },
  degrees: {
    label: "Rotation",
    description:
      "Random rotation range in degrees. Useful when object orientation varies (e.g. parts on a rotating table); keep 0 for fixed-orientation scenes.",
    input: "number",
    min: 0,
    max: 180,
    step: 1,
  },
  translate: {
    label: "Translation",
    description: "Random translation fraction. Default 0.1.",
    input: "number",
    min: 0,
    max: 0.9,
    step: 0.05,
  },
  scale: {
    label: "Scale gain",
    description:
      "Random scale gain. Default 0.5; lower when object size is consistent (fixed camera distance).",
    input: "number",
    min: 0,
    max: 1,
    step: 0.05,
  },
  shear: {
    label: "Shear",
    description: "Random shear in degrees. Usually 0-2 for industrial scenes.",
    input: "number",
    min: 0,
    max: 10,
    step: 0.5,
  },
  perspective: {
    label: "Perspective",
    description:
      "Random perspective distortion. Tiny values (0-0.001); keep 0 for fixed cameras.",
    input: "number",
    min: 0,
    max: 0.001,
    step: 0.0001,
  },
  flipud: {
    label: "Vertical flip",
    description:
      "Vertical flip probability. Only enable when the scene has no fixed up direction (e.g. top-down views).",
    input: "number",
    min: 0,
    max: 1,
    step: 0.05,
  },
  fliplr: {
    label: "Horizontal flip",
    description:
      "Horizontal flip probability. Default 0.5; set 0 when left/right orientation matters.",
    input: "number",
    min: 0,
    max: 1,
    step: 0.05,
  },
  amp: {
    label: "Mixed precision",
    description:
      "Automatic mixed precision — faster training with negligible accuracy impact. Keep on unless debugging numeric issues.",
    input: "boolean",
  },
  workers: {
    label: "Dataloader workers",
    description:
      "Dataloader worker processes. Lower (2-4) only for memory-constrained runs.",
    input: "integer",
    min: 0,
    max: 16,
  },
};

export const HYPERPARAM_SUGGESTION_REGISTRY: Partial<
  Record<ModelBackendEnum, HyperparamRegistryEntry>
> = {
  [ModelBackendEnum.ULTRALYTICS]: defineRegistryEntry(
    ULTRALYTICS_SUGGESTIBLE_PARAMS,
  ),
};
