from pydantic import field_validator

from .base_schema import BaseSchema


class PolygonSplitConfig(BaseSchema):
    """Optional dataset-prep step that splits a single polygon annotation into
    multiple components when the polygon traces a thin "bridge" between two
    visually-separate pieces (current annotation convention for kapie /
    sunkovy salam). Each component becomes its own YOLO label line so the
    model is trained on natural single-blob predictions instead of a single
    instance that spans empty space.

    Disabled unless explicitly enabled on the model's customHyperparams.
    """

    enabled: bool = False
    # Internal class indices (0-based) that should be subject to the split.
    # Translated by the API from human-readable label names before sending.
    class_indices: list[int] = []
    # Square structuring element size, in pixels of the original image. Must
    # be a positive odd integer so the morphological opening kernel has a
    # well-defined centre.
    kernel_size: int = 9

    @field_validator("kernel_size")
    @classmethod
    def _kernel_must_be_positive_odd(cls, v: int) -> int:
        if v <= 0:
            raise ValueError(f"kernel_size must be positive, got {v}")
        if v % 2 == 0:
            raise ValueError(f"kernel_size must be odd, got {v}")
        return v
