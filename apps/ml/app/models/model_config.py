from .base_schema import BaseSchema
from .model_type import ModelType, ModelOutputType
from .training_config import TrainingConfig
from .image import Image


class ModelConfig(BaseSchema):
    id: int
    type: ModelType
    training_config: TrainingConfig
    data: list[Image]
    output_types: list[ModelOutputType] = [
        ModelOutputType.RAW,
        ModelOutputType.RVC3,
        ModelOutputType.RVC4,
    ]
