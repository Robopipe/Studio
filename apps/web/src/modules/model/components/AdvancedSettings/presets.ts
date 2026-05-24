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
    description: "Smaller batch size for quick iteration",
    config: {
      trainer: {
        batch_size: 4,
      },
    },
  },
  {
    id: "high-accuracy",
    name: "High Accuracy",
    description:
      "Larger batch size and lower learning rate for better convergence",
    config: {
      trainer: {
        batch_size: 16,
        optimizer: {
          name: "Adam",
          params: { lr: 0.0005 },
        },
      },
    },
  },
  {
    id: "low-memory",
    name: "Low Memory",
    description: "Smaller batch size for constrained environments",
    config: {
      trainer: {
        batch_size: 2,
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
  {
    id: "yolo26-fast",
    name: "YOLO26 Fast",
    description: "YOLO26 nano — NMS-free, faster CPU inference, quick iteration",
    config: {
      model_variant: "yolo26n",
      imgsz: 640,
      optimizer: "AdamW",
      lr0: 0.001,
      cos_lr: true,
      patience: 20,
      hsv_s: 0.15,
      hsv_v: 0.2,
      degrees: 15.0,
      cls: 0.8,
    },
  },
  {
    id: "yolo26-accuracy",
    name: "YOLO26 High Accuracy",
    description:
      "YOLO26 large at 1280px — NMS-free, edge-optimised, tuned for fine-grained classification",
    config: {
      model_variant: "yolo26l",
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
      box: 9.0,
      cls: 0.8,
      mosaic: 1.0,
      close_mosaic: 25,
      copy_paste: 0.2,
      erasing: 0.4,
      hsv_h: 0.01,
      hsv_s: 0.15,
      hsv_v: 0.2,
      degrees: 15.0,
      translate: 0.1,
      scale: 0.5,
      shear: 2.0,
      perspective: 0.0005,
      fliplr: 0.5,
      amp: true,
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
