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
    # DB label IDs, parallel to `labels`: label_ids[i] is the DB label id for
    # the class whose internal luxonis-train index is `i`. Used to translate
    # per-class metric suffixes back to label IDs when reporting to the API.
    label_ids: list[int]
    augmentations: list[_AugUnion]
    preprocessings: list[_AugUnion] = []
    use_groups: bool

    @field_validator("dataset_split")
    @classmethod
    def validate_split_sum(cls, v):
        if sum(v) != 100:
            raise ValueError(f"Dataset split must sum to 100, got {sum(v)}")
        return v
