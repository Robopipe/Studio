from .base_schema import BaseSchema
from .dataset_config import DatasetConfig
from .model_type import ModelOutputType
from .polygon_split_config import PolygonSplitConfig


class OutputUpload(BaseSchema):
    type: ModelOutputType
    url: str
    object_path: str


class TrainingConfig(BaseSchema):
    epochs: int
    batch_size: int = 8
    dataset_config: DatasetConfig
    output_types: list[ModelOutputType]
    custom_hyperparams: dict = {}
    # Optional dataset-prep tweak that splits "bridged" polygon annotations
    # into one label entry per visually-disconnected piece. See
    # PolygonSplitConfig for the full rationale.
    polygon_split: PolygonSplitConfig | None = None
