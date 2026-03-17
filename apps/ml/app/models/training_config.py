from .base_schema import BaseSchema
from .dataset_config import DatasetConfig
from .model_type import ModelOutputType


class TrainingConfig(BaseSchema):
    epochs: int
    batch_size: int = 8
    dataset_config: DatasetConfig
    output_types: list[ModelOutputType]
    custom_hyperparams: dict = {}
