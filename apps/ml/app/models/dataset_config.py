from pydantic import field_validator, Field

from typing import Annotated, Union

from .augmentations.augmentation import AUG_REGISTRY
from .base_schema import BaseSchema


_AugUnion = Annotated[
    Union[
        tuple(
            x for x in AUG_REGISTRY.values() for x in x
        )  # pyright: ignore[reportInvalidTypeForm]
    ],
    Field(discriminator="type"),
]


class DatasetConfig(BaseSchema):
    dataset_split: tuple[int, int, int]  # (train, val, test)
    labels: list[int]
    augmentations: list[_AugUnion]
    preprocessings: list[_AugUnion] = []
    preprocessing_keep_originals: bool = True

    @field_validator("dataset_split")
    @classmethod
    def validate_split_sum(cls, v):
        if sum(v) != 100:
            raise ValueError(f"Dataset split must sum to 100, got {sum(v)}")
        return v
