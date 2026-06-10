import z from "zod";

export enum PreAnnotateModelTypeEnum {
  SEGMENTATION = "segmentation",
}

const segmentationBlobSchema = z.object({
  conf: z.number().min(0).max(1),
  iou: z.number().min(0).max(1),
  minAreaPx: z.number().int().min(0).max(10000),
  polyEpsilon: z.number().min(0).max(0.05),
  maskThreshold: z.number().min(0).max(1),
  fillConcavityLabelIds: z.number().int().positive().array(),
});

export const preAnnotateSettingsSchema = z.discriminatedUnion("modelType", [
  segmentationBlobSchema.extend({
    modelType: z.literal(PreAnnotateModelTypeEnum.SEGMENTATION),
    modelId: z.number().int().positive().nullable(),
  }),
]);

export { segmentationBlobSchema };
