from .base_schema import BaseSchema
from .model_type import ModelType
from .training_config import OutputUpload, TrainingConfig
from .image import Image


class ModelConfig(BaseSchema):
    id: int
    type: ModelType
    training_config: TrainingConfig
    output_config: list[OutputUpload]
    data: list[Image]
