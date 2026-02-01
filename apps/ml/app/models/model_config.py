from .base_schema import BaseSchema
from .model_type import ModelType
from .training_config import TrainingConfig
from .image import Image


class ModelConfig(BaseSchema):
    id: int
    type: ModelType
    training_config: TrainingConfig
    data: list[Image]
