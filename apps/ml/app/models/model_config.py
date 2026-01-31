from pydantic import BaseModel

from .model_type import ModelType, ModelOutputType
from .training_config import TrainingConfig
from .image import Image


class ModelConfig(BaseModel):
    id: str
    type: ModelType
    training_config: TrainingConfig
    data: list[Image]
    output_types: list[ModelOutputType]
