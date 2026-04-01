import {
  ModelAugmentationTypeEnum,
  modelLogMetricsSchema,
  ModelOutputTypeEnum,
  ProjectTypeEnum,
} from "@repo/schema";
import z from "zod";

/**
 * Training updates
 * ML Service -> Backend
 */

export enum TrainingProgressTypeEnum {
  LOG = "log",
  ERROR = "error",
}

export const trainingProgressErrorRequestSchema = z.object({
  errorMessage: z.string(),
});

export const trainingProgressLogRequestSchema = z.object({
  epoch: z.number(),
  metrics: modelLogMetricsSchema,
});

export const trainingProgressContentSchema = z.discriminatedUnion("type", [
  trainingProgressLogRequestSchema.extend({
    type: z.literal(TrainingProgressTypeEnum.LOG),
  }),
  trainingProgressErrorRequestSchema.extend({
    type: z.literal(TrainingProgressTypeEnum.ERROR),
  }),
]);

export const trainingProgressRequestSchema = z.object({progress: trainingProgressContentSchema});

export type TrainingProgressData = z.infer<typeof trainingProgressRequestSchema>;

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
  ...trainingSharedLabelSchema,
});

export const trainingRectangleLabelSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  ...trainingSharedLabelSchema,
});

export const trainingConfigSchema = z.object({
  output_types: z.enum(ModelOutputTypeEnum).array(),
  epochs: z.number(),
  dataset_config: z.object({
    dataset_split: z.tuple([z.number(), z.number(), z.number()]),
    labels: z.number().array(),
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
      })
      .array(),
    preprocessing_keep_originals: z.boolean(),
  }),
  custom_hyperparams: z.record(z.string(), z.unknown()).default({}),
});

const basePayload = z.object({
  id: z.number(),
  training_config: trainingConfigSchema,
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
