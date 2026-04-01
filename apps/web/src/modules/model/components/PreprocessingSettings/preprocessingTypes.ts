/**
 * Preprocessing type definitions — derived from augmentation types with the
 * probability parameter removed (preprocessing is always applied deterministically).
 */

import {
  AugmentationDefinition,
  AugmentationParam,
  getAugmentationSummary,
  IMAGE_AUGMENTATIONS,
} from "../AugmentationSettings/augmentationTypes";

function stripProbability(params: AugmentationParam[]): AugmentationParam[] {
  return params.filter((p) => p.key !== "p");
}

export const PREPROCESSING_DEFINITIONS: AugmentationDefinition[] =
  IMAGE_AUGMENTATIONS.map((def) => ({
    ...def,
    params: stripProbability(def.params),
  }));

export function getPreprocessingById(
  id: string,
): AugmentationDefinition | undefined {
  return PREPROCESSING_DEFINITIONS.find((a) => a.id === id);
}

export { getAugmentationSummary as getPreprocessingSummary };
