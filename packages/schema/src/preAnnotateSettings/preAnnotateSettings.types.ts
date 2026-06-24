import z from "zod";
import {
  PreAnnotateModelTypeEnum,
  preAnnotateSettingsSchema,
  segmentationBlobSchema,
  detectionBlobSchema,
} from "./preAnnotateSettings.schema";

export type PreAnnotateSettings = z.infer<typeof preAnnotateSettingsSchema>;

export type SegmentationPreAnnotateSettings = Extract<
  PreAnnotateSettings,
  { modelType: PreAnnotateModelTypeEnum.SEGMENTATION }
>;

export type DetectionPreAnnotateSettings = Extract<
  PreAnnotateSettings,
  { modelType: PreAnnotateModelTypeEnum.DETECTION }
>;

export type PreAnnotateSettingsBlob =
  | z.infer<typeof segmentationBlobSchema>
  | z.infer<typeof detectionBlobSchema>;

export const PRE_ANNOTATE_DEFAULTS: {
  [PreAnnotateModelTypeEnum.SEGMENTATION]: SegmentationPreAnnotateSettings;
  [PreAnnotateModelTypeEnum.DETECTION]: DetectionPreAnnotateSettings;
} = {
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
  [PreAnnotateModelTypeEnum.DETECTION]: {
    modelType: PreAnnotateModelTypeEnum.DETECTION,
    modelId: null,
    conf: 0.25,
    iou: 0.45,
    minAreaPx: 4,
  },
};
