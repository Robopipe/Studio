import { ModelBackendEnum } from "@repo/schema";

export interface HyperparamsPreset {
  id: string;
  name: string;
  description: string;
  config: Record<string, unknown>;
}

const LUXONIS_PRESETS: HyperparamsPreset[] = [
  {
    id: "fast-training",
    name: "Fast Training",
    description: "Light model variant, small batch for quick iteration",
    config: {
      model: { predefined_model: { variant: "light" } },
      trainer: {
        batch_size: 4,
        optimizer: { name: "Adam", params: { lr: 0.001 } },
      },
    },
  },
  {
    id: "high-accuracy",
    name: "High Accuracy",
    description:
      "Heavy variant with AdamW + cosine LR for best convergence",
    config: {
      model: { predefined_model: { variant: "heavy" } },
      trainer: {
        batch_size: 16,
        optimizer: {
          name: "AdamW",
          params: { lr: 0.001, weight_decay: 0.0005 },
        },
        scheduler: {
          name: "CosineAnnealingLR",
          params: { eta_min: 1e-6 },
        },
      },
    },
  },
  {
    id: "low-memory",
    name: "Low Memory",
    description:
      "Light variant, tiny batch with gradient accumulation for constrained GPUs",
    config: {
      model: { predefined_model: { variant: "light" } },
      trainer: {
        batch_size: 2,
        accumulate_grad_batches: 4,
        optimizer: { name: "Adam", params: { lr: 0.001 } },
      },
    },
  },
];

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
  backend: ModelBackendEnum,
): HyperparamsPreset[] => {
  switch (backend) {
    case ModelBackendEnum.ULTRALYTICS:
      return ULTRALYTICS_PRESETS;
    case ModelBackendEnum.LUXONIS:
    default:
      return LUXONIS_PRESETS;
  }
};
