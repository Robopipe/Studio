from typing import Optional
from .base_schema import BaseSchema
from .model_type import ModelType
from .training_config import CheckpointConfig, OutputUpload, TrainingConfig
from .image import Image


class ModelConfig(BaseSchema):
    id: int
    type: ModelType
    training_config: TrainingConfig
    output_config: list[OutputUpload]
    checkpoint_config: Optional[CheckpointConfig] = None
    data: list[Image]
