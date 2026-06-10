import z from "zod";
import {
  PreAnnotateModelTypeEnum,
  preAnnotateSettingsSchema,
  segmentationBlobSchema,
} from "./preAnnotateSettings.schema";

export type PreAnnotateSettings = z.infer<typeof preAnnotateSettingsSchema>;

export type PreAnnotateSettingsBlob = z.infer<typeof segmentationBlobSchema>;

export const PRE_ANNOTATE_DEFAULTS: Record<
  PreAnnotateModelTypeEnum,
  PreAnnotateSettings
> = {
  [PreAnnotateModelTypeEnum.SEGMENTATION]: {
    modelType: PreAnnotateModelTypeEnum.SEGMENTATION,
    modelId: null,
    conf: 0.25,
    iou: 0.45,
    minAreaPx: 4,
    polyEpsilon: 0.005,
    maskThreshold: 0.5,
    fillConcavityLabelIds: [],
  },
};
