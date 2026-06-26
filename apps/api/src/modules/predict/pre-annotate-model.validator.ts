import { BadRequestException } from "@nestjs/common";
import {
  ModelOutputTypeEnum,
  ModelStatusEnum,
  PreAnnotateModelTypeEnum,
  ProjectTypeEnum,
} from "@repo/schema";
import { ModelEntity } from "../model/entity/model.entity";

/**
 * Assert that a model can be used for pre-annotation of the given type.
 *
 * Callers must perform their own existence (null) check before calling this.
 * Throws BadRequestException with a descriptive message on any violation.
 */
export function assertModelUsableForPreAnnotation(
  model: ModelEntity,
  modelType: PreAnnotateModelTypeEnum,
): void {
  if (model.status !== ModelStatusEnum.DONE) {
    throw new BadRequestException(
      `model status must be DONE, got ${model.status}`,
    );
  }

  if (model.labels.length === 0) {
    throw new BadRequestException(
      "model has no labels recorded; cannot map predictions",
    );
  }

  if (model.trainingType === ProjectTypeEnum.CLASSIFICATION) {
    throw new BadRequestException(
      "classification models cannot be used for pre-annotation",
    );
  }

  if (
    modelType === PreAnnotateModelTypeEnum.DETECTION &&
    model.trainingType !== ProjectTypeEnum.DETECTION
  ) {
    throw new BadRequestException(
      "detection pre-annotation requires a detection model",
    );
  }

  if (
    modelType === PreAnnotateModelTypeEnum.SEGMENTATION &&
    model.trainingType !== ProjectTypeEnum.SEGMENTATION
  ) {
    throw new BadRequestException(
      "segmentation pre-annotation requires a segmentation model",
    );
  }

  const hasRawOutput = model.outputs.some(
    (o) => o.type === ModelOutputTypeEnum.RAW,
  );
  if (!hasRawOutput) {
    throw new BadRequestException(
      "model has no RAW output; retrain with RAW export enabled or wait for export to finish",
    );
  }
}
