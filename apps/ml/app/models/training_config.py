from pydantic import BaseModel

from .dataset_config import DatasetConfig


class TrainingConfig(BaseModel):
    epochs: int
    batch_size: int
    dataset_config: DatasetConfig
