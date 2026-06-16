import {
  ModelAugmentationTypeEnum,
  modelLogConfusionMatrixSchema,
  modelLogMetricsSchema,
  modelLogPerClassMetricsSchema,
  ModelOutputTypeEnum,
  ModelQuantizationEnum,
  ProjectTypeEnum,
} from "@repo/schema";
import z from "zod";

/**
 * Training updates
 * ML Service -> Backend
 */

export enum TrainingProgressTypeEnum {
  LOG = "log",
  CONVERTING = "converting",
  ERROR = "error",
}

export const trainingProgressErrorRequestSchema = z.object({
  errorMessage: z.string(),
});

export const trainingProgressLogRequestSchema = z.object({
  epoch: z.number(),
  metrics: modelLogMetricsSchema,
  perClassMetrics: modelLogPerClassMetricsSchema.nullish(),
  confusionMatrix: modelLogConfusionMatrixSchema.nullish(),
});

export const trainingProgressConvertingRequestSchema = z.object({});

export const trainingProgressContentSchema = z.discriminatedUnion("type", [
  trainingProgressLogRequestSchema.extend({
    type: z.literal(TrainingProgressTypeEnum.LOG),
  }),
  trainingProgressConvertingRequestSchema.extend({
    type: z.literal(TrainingProgressTypeEnum.CONVERTING),
  }),
  trainingProgressErrorRequestSchema.extend({
    type: z.literal(TrainingProgressTypeEnum.ERROR),
  }),
]);

export const trainingProgressRequestSchema = z.object({progress: trainingProgressContentSchema});

export type TrainingProgressData = z.infer<typeof trainingProgressRequestSchema>;

/**
 * Training complete
 * ML Service -> Backend
 * Fired once after all model outputs have been PUT to their signed URLs.
 */
export const trainingCompleteRequestSchema = z.object({
  outputs: z
    .object({
      type: z.enum(ModelOutputTypeEnum),
      objectPath: z.string(),
    })
    .array(),
  finalAccuracy: z.number().nullable(),
  finalLoss: z.number().nullable(),
  // Best mAP@50 across epochs (det/seg only). Null for classification.
  // Optional so older ml-yolo deployments without the field still validate.
  bestMap50: z.number().nullable().optional(),
});

export type TrainingCompleteData = z.infer<typeof trainingCompleteRequestSchema>;

/**
 * Training payload
 * Backend -> ML service
 */
export const trainingSharedLabelSchema = {
  label: z.object({
    label_number: z.number(),
  }),
};

export const trainingClassificationLabelSchema = z.object({
  ...trainingSharedLabelSchema,
});

export const trainingPolygonLabelSchema = z.object({
  points: z.tuple([z.number(), z.number()]).array(),
  group_id: z.string().nullable(),
  ...trainingSharedLabelSchema,
});

export const trainingRectangleLabelSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  group_id: z.string().nullable(),
  ...trainingSharedLabelSchema,
});

export const trainingConfigSchema = z.object({
  output_types: z.enum(ModelOutputTypeEnum).array(),
  epochs: z.number(),
  // Optional because the Luxonis ML service has Pydantic `extra="forbid"`
  // and only ml-yolo consumes it. The API includes this key only for the
  // Ultralytics dispatch (see training-external.service.ts).
  quantization: z.enum(ModelQuantizationEnum).optional(),
  dataset_config: z.object({
    dataset_split: z.tuple([z.number(), z.number(), z.number()]),
    labels: z.number().array(),
    label_ids: z.number().array(),
    augmentations: z
      .object({
        type: z.enum(ModelAugmentationTypeEnum),
        params: z.record(z.string(), z.unknown()),
      })
      .array(),
    preprocessings: z
      .object({
        type: z.enum(ModelAugmentationTypeEnum),
        params: z.record(z.string(), z.unknown()),
        keep_original: z.boolean(),
      })
      .array(),
    use_groups: z.boolean(),
  }),
  custom_hyperparams: z.record(z.string(), z.unknown()).default({}),
});

export const trainingOutputUploadSchema = z.object({
  type: z.enum(ModelOutputTypeEnum),
  url: z.string(),
  object_path: z.string(),
});

const basePayload = z.object({
  id: z.number(),
  training_config: trainingConfigSchema,
  output_config: trainingOutputUploadSchema.array(),
});

const createDataSchema = <T extends z.ZodTypeAny>(labelSchema: T) =>
  z
    .object({
      file_url: z.string(),
      width: z.number(),
      height: z.number(),
      labels: labelSchema.array(),
    })
    .array();

export const trainingPayloadSchema = z.discriminatedUnion("type", [
  basePayload.extend({
    type: z.literal(ProjectTypeEnum.SEGMENTATION),
    data: createDataSchema(trainingPolygonLabelSchema),
  }),
  basePayload.extend({
    type: z.literal(ProjectTypeEnum.DETECTION),
    data: createDataSchema(
      trainingRectangleLabelSchema.or(trainingPolygonLabelSchema),
    ),
  }),
  basePayload.extend({
    type: z.literal(ProjectTypeEnum.CLASSIFICATION),
    data: createDataSchema(trainingClassificationLabelSchema),
  }),
]);

export type TrainingBasePayload = z.infer<typeof basePayload>;
export type TrainingPayload = z.infer<typeof trainingPayloadSchema>;
