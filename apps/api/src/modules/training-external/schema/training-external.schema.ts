import z from "zod";
import { ProjectTypeEnum } from "@repo/schema";
import { modelLogMetricsSchema, ModelOutputTypeEnum } from "@repo/schema";

/**
 * Training updates
 * ML Service -> Backend
 */


export const trainingProgressRequestSchema = z.object({
  epoch: z.number(),
  metrics: modelLogMetricsSchema
})


/**
 * Training payload
 * Backend -> ML service
 */
export const trainingSharedLabelSchema = {
  label: z.object({
    label_number: z.number()
  })
}

export const trainingClassificationLabelSchema = z.object({
  ...trainingSharedLabelSchema
})

export const trainingPolygonLabelSchema = z.object({
  points: z.tuple([z.number(), z.number()]).array(),
  ...trainingSharedLabelSchema,
})

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
  }),
});

const basePayload = z.object({
  id: z.number(),
  training_config: trainingConfigSchema,
});

const createDataSchema = <T extends z.ZodTypeAny>(labelSchema: T) => z.object({
  file_url: z.string(),
  width: z.number(),
  height: z.number(),
  labels: labelSchema.array()
}).array()

export const trainingPayloadSchema = z.discriminatedUnion("type", [
  basePayload.extend({
    type: z.literal(ProjectTypeEnum.SEGMENTATION),
    data: createDataSchema(trainingPolygonLabelSchema),
  }),
  basePayload.extend({
    type: z.literal(ProjectTypeEnum.DETECTION),
    data: createDataSchema(trainingRectangleLabelSchema),
  }),
  basePayload.extend({
    type: z.literal(ProjectTypeEnum.CLASSIFICATION),
    data: createDataSchema(trainingClassificationLabelSchema),
  })
]);

export type TrainingBasePayload = z.infer<typeof basePayload>;
export type TrainingPayload = z.infer<typeof trainingPayloadSchema>
