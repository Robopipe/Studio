from enum import Enum


class LuxonisModelType(str, Enum):
    CLASSIFICATION = "ClassificationModel"
    DETECTION = "DetectionModel"
    SEGMENTATION = "SegmentationModel"


class ModelType(str, Enum):
    CLASSIFICATION = "CLASSIFICATION"
    DETECTION = "DETECTION"
    SEGMENTATION = "SEGMENTATION"

    def to_luxonis_model_type(self) -> LuxonisModelType:
        mapping = {
            ModelType.CLASSIFICATION: LuxonisModelType.CLASSIFICATION,
            ModelType.DETECTION: LuxonisModelType.DETECTION,
            ModelType.SEGMENTATION: LuxonisModelType.SEGMENTATION,
        }
        return mapping[self]


class ModelOutputType(str, Enum):
    RAW = "RAW"
    RVC2 = "RVC2"
    RVC3 = "RVC3"
    RVC4 = "RVC4"
