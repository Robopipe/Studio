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
    # Selects HubAI's quantization mode at convert time. "FP16" -> the
    # standard fp16 weights path (no calibration). "INT8" -> int8 with
    # HubAI's built-in default calibration (handled server-side by HubAI;
    # we don't ship a calibration dataset). Optional/defaulted so the
    # field stays backward-compatible with older API builds.
    quantization: str = "FP16"
    # Optional dataset-prep tweak that splits "bridged" polygon annotations
    # into one label entry per visually-disconnected piece. See
    # PolygonSplitConfig for the full rationale.
    polygon_split: PolygonSplitConfig | None = None
