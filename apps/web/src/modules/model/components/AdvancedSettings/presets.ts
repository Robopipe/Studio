import { ProjectTypeEnum } from "@repo/schema";

export interface HyperparamsPreset {
  id: string;
  name: string;
  description: string;
  config: Record<string, unknown>;
}

const VARIANT_SUFFIX: Record<ProjectTypeEnum, string> = {
  [ProjectTypeEnum.DETECTION]: "",
  [ProjectTypeEnum.SEGMENTATION]: "-seg",
  [ProjectTypeEnum.CLASSIFICATION]: "-cls",
};

// Swap the task suffix on a yolo variant, preserving the size (n/s/m/l/x).
// Leaves non-yolo values (custom weight names/paths) untouched.
export const applyModelVariantSuffix = (
  variant: string,
  trainingType: ProjectTypeEnum,
): string => {
  if (!/^yolo/i.test(variant)) return variant;
  return variant.replace(/-(seg|cls)$/, "") + VARIANT_SUFFIX[trainingType];
};

// Distilled from training-configs/ultralytics-hyperparams*.json runs.
// `batch` and `epochs` are intentionally omitted — they're controlled by the
// form fields and pulled from training_config in ultralytics_config.py.
const ULTRALYTICS_PRESETS: HyperparamsPreset[] = [
  {
    id: "fast-training",
    name: "Fast Training",
    description: "Nano model at 640px for quick iteration",
    config: {
      model_variant: "yolo11n",
      imgsz: 640,
      optimizer: "AdamW",
      lr0: 0.001,
      cos_lr: true,
      patience: 20,
    },
  },
  {
    id: "high-accuracy",
    name: "High Accuracy",
    description:
      "Large model at 1280px with AdamW + cosine LR and tuned augmentations",
    config: {
      model_variant: "yolo11l",
      imgsz: 1280,
      optimizer: "AdamW",
      lr0: 0.001,
      lrf: 0.01,
      momentum: 0.937,
      weight_decay: 0.0005,
      cos_lr: true,
      warmup_epochs: 5,
      warmup_momentum: 0.8,
      warmup_bias_lr: 0.1,
      patience: 50,
      box: 7.5,
      cls: 0.5,
      dfl: 1.5,
      mosaic: 1.0,
      close_mosaic: 15,
      mixup: 0.15,
      copy_paste: 0.1,
      hsv_h: 0.015,
      hsv_s: 0.7,
      hsv_v: 0.4,
      translate: 0.1,
      scale: 0.5,
      fliplr: 0.5,
      amp: true,
    },
  },
  {
    id: "low-memory",
    name: "Low Memory",
    description: "Nano model at 640px with reduced workers",
    config: {
      model_variant: "yolo11n",
      imgsz: 640,
      workers: 4,
      optimizer: "AdamW",
      lr0: 0.001,
      cos_lr: true,
      patience: 30,
    },
  },
];

export const getHyperparamsPresets = (
  trainingType: ProjectTypeEnum,
): HyperparamsPreset[] =>
  ULTRALYTICS_PRESETS.map((preset) => ({
    ...preset,
    config: {
      ...preset.config,
      model_variant: applyModelVariantSuffix(
        preset.config.model_variant as string,
        trainingType,
      ),
    },
  }));
