from .base_schema import BaseSchema
from .dataset_config import DatasetConfig


class TrainingConfig(BaseSchema):
    epochs: int
    batch_size: int = 8
    dataset_config: DatasetConfig
