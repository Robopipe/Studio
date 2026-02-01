from pydantic import field_validator

from .base_schema import BaseSchema


class DatasetConfig(BaseSchema):
    dataset_split: tuple[int, int, int]  # (train, val, test)
    labels: list[int]

    @field_validator("dataset_split")
    @classmethod
    def validate_split_sum(cls, v):
        if sum(v) != 100:
            raise ValueError(f"Dataset split must sum to 100, got {sum(v)}")
        return v
