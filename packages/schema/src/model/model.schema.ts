import z from "zod";
import { timestampsSchema } from "../helpers";
import { labelSchema } from "../label";
import { TaskFileTypeEnum } from "../task";

export enum ModelStatusEnum {
  DRAFT = "DRAFT",
  TRAINING = "TRAINING",
  CONVERTING = "CONVERTING",
  DONE = "DONE",
}

export const modelSchema = z.object({
  id: z.number(),
  name: z.string(),
  status: z.enum(ModelStatusEnum),
  epochs: z.number(),
  labels: labelSchema.array(),
  // Train, validate and test should add to 1
  splitTrain: z.number(),
  splitValidate: z.number(),
  splitTest: z.number(),
  ...timestampsSchema
})

export const modelLogMetricsSchema = z.object({
  accuracy: z.number(),
  loss: z.number(),
})

export const modelLogSchema = z.object({
  id: z.number(),
  epoch: z.number(),
  metrics: modelLogMetricsSchema,
  createdAt: z.iso.datetime()
})


export const createModelSchema = modelSchema.pick({
  name: true,
  epochs: true,
  splitTrain: true,
  splitValidate: true,
  splitTest: true,
}).extend({
  labelIds: z.number().array()
})

export const updateModelSchema = createModelSchema


export enum ModelOutputTypeEnum {
  RAW = "RAW",
  RVC4 = "RVC4",
  RVC3 = "RVC3",
}

export const modelOutputSchema = z.object({
  id: z.number(),
  type: z.enum(ModelOutputTypeEnum),
  filePath: z.string(),
  fileType: z.enum(TaskFileTypeEnum)
})
