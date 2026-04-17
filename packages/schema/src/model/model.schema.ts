import z from "zod";
import { timestampsSchema } from "../helpers";
// hyperparamsConfigSchema import kept for reference — validation intentionally bypassed
// import { hyperparamsConfigSchema } from "./hyperparams-config.schema";
import { labelSchema } from "../label";
import { ProjectTypeEnum } from "../projects";
import { TaskFileTypeEnum } from "../task";

export enum ModelStatusEnum {
  DRAFT = "DRAFT",
  TRAINING = "TRAINING",
  CONVERTING = "CONVERTING",
  DONE = "DONE",
  ERROR = "ERROR",
}
export enum ModelOutputTypeEnum {
  RAW = "RAW",
  RVC4 = "RVC4",
  RVC3 = "RVC3",
  RVC2 = "RVC2",
}
export enum ModelAugmentationTypeEnum {
  FLIP = "FLIP",
  ROTATE90 = "ROTATE90",
  CROP = "CROP",
  ROTATION = "ROTATION",
  SHEAR = "SHEAR",
  GRAYSCALE = "GRAYSCALE",
  HUE = "HUE",
  SATURATION = "SATURATION",
  BRIGHTNESS = "BRIGHTNESS",
  CONTRAST = "CONTRAST",
  BLUR = "BLUR",
  NOISE = "NOISE",
  CUTOUT = "CUTOUT",
  MOSAIC = "MOSAIC",
  CLAHE = "CLAHE",
  SHARPEN = "SHARPEN",
  MOTION_BLUR = "MOTION_BLUR",
  MEDIAN_BLUR = "MEDIAN_BLUR",
  DOWNSCALE = "DOWNSCALE",
  IMAGE_COMPRESSION = "IMAGE_COMPRESSION",
  PERSPECTIVE = "PERSPECTIVE",
  EQUALIZE = "EQUALIZE",
  POSTERIZE = "POSTERIZE",
  RGB_SHIFT = "RGB_SHIFT",
}

export const modelAugmentationSchema = z.object({
  id: z.number(),
  modelId: z.number(),
  type: z.enum(ModelAugmentationTypeEnum),
  params: z.record(z.string(), z.unknown()),
});

export const modelPreprocessingSchema = z.object({
  id: z.number(),
  modelId: z.number(),
  type: z.enum(ModelAugmentationTypeEnum),
  params: z.record(z.string(), z.unknown()),
  keepOriginal: z.boolean(),
});

export const modelSchema = z.object({
  id: z.number(),
  name: z.string(),
  status: z.enum(ModelStatusEnum),
  epochs: z.number(),
  labels: labelSchema.array(),
  taskIds: z.number().array(),
  outputTypes: z.enum(ModelOutputTypeEnum).array(),
  trainingType: z.enum(ProjectTypeEnum),
  annotationsUsed: z.enum(ProjectTypeEnum).array(),
  // Train, validate and test should add to 1
  splitTrain: z.number(),
  splitValidate: z.number(),
  splitTest: z.number(),
  customHyperparams: z.record(z.string(), z.unknown()),
  augmentations: modelAugmentationSchema.pick({ type: true, params: true }).array(),
  preprocessings: modelPreprocessingSchema.pick({ type: true, params: true, keepOriginal: true }).array(),
  errorMessage: z.string().nullable(),
  finalAccuracy: z.number().nullable(),
  finalLoss: z.number().nullable(),
  ...timestampsSchema,
});

export const modelLogMetricsSchema = z
  .object({
    accuracy: z.number(),
    loss: z.number(),
  })
  .loose();

export const modelLogSchema = z.object({
  id: z.number(),
  epoch: z.number(),
  metrics: modelLogMetricsSchema,
  createdAt: z.iso.datetime(),
});

export const createModelSchema = modelSchema
  .pick({
    name: true,
    epochs: true,
    outputTypes: true,
    trainingType: true,
    annotationsUsed: true,
    splitTrain: true,
    splitValidate: true,
    splitTest: true,
  })
  .extend({
    labelIds: z.number().array(),
    taskIds: z.number().array().default([]),
    augmentations: z
      .object({
        type: z.enum(ModelAugmentationTypeEnum),
        params: z.record(z.string(), z.unknown()),
      })
      .array()
      .default([]),
    preprocessings: z
      .object({
        type: z.enum(ModelAugmentationTypeEnum),
        params: z.record(z.string(), z.unknown()),
        keepOriginal: z.boolean().default(false),
      })
      .array()
      .default([]),
    // Schema validation intentionally bypassed — any JSON object is accepted.
    // Original: customHyperparams: hyperparamsConfigSchema.default({}),
    customHyperparams: z.record(z.string(), z.unknown()).default({}),
    train: z.boolean().default(false),
  })
  .refine(
    (data) => {
      switch (data.trainingType) {
        case ProjectTypeEnum.CLASSIFICATION:
        case ProjectTypeEnum.SEGMENTATION:
          return (
            data.annotationsUsed.length === 1 &&
            data.annotationsUsed[0] === data.trainingType
          );
        case ProjectTypeEnum.DETECTION:
          return (
            data.annotationsUsed.length > 0 &&
            data.annotationsUsed.every(
              (t) => t === ProjectTypeEnum.DETECTION || t === ProjectTypeEnum.SEGMENTATION,
            )
          );
      }
    },
    { message: "annotationsUsed is invalid for the selected trainingType" },
  );

export const updateModelSchema = createModelSchema;

export const modelOutputSchema = z.object({
  id: z.number(),
  type: z.enum(ModelOutputTypeEnum),
  filePath: z.string(),
  fileType: z.enum(TaskFileTypeEnum),
});
