import { ProjectTypeEnum } from "@repo/schema";

export const TRAINING_TYPE_LABELS: Record<ProjectTypeEnum, string> = {
  [ProjectTypeEnum.CLASSIFICATION]: "Classification",
  [ProjectTypeEnum.DETECTION]: "Detection",
  [ProjectTypeEnum.SEGMENTATION]: "Segmentation",
};
