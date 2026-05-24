from pydantic import model_validator

from typing import Union

from .base_schema import BaseSchema
from .labels.classification_label import ClassificationLabel
from .labels.polygon_label import PolygonLabel
from .labels.rectangle_label import RectangleLabel
from .model_type import ModelType
from .polygon_split_config import PolygonSplitConfig


class Image(BaseSchema):
    file_url: str
    width: int
    height: int
    labels: list[Union[ClassificationLabel, PolygonLabel, RectangleLabel]] = []

    def labels_str(
        self,
        model_type: ModelType | None = None,
        polygon_split: PolygonSplitConfig | None = None,
    ) -> list[str]:
        result = []
        for label in self.labels:
            if isinstance(label, ClassificationLabel):
                result.append(label.to_str(self.width, self.height))
            elif isinstance(label, PolygonLabel):
                kernel = (
                    polygon_split.kernel_size
                    if polygon_split
                    and polygon_split.enabled
                    and label.label.label_number in polygon_split.class_indices
                    else None
                )
                if model_type == ModelType.DETECTION:
                    result.extend(
                        label.to_bbox_str_lines(self.width, self.height, kernel)
                    )
                else:
                    result.extend(
                        label.to_str_lines(self.width, self.height, kernel)
                    )
            elif isinstance(label, RectangleLabel):
                result.append(label.to_str(self.width, self.height))
        return result

    @model_validator(mode="before")
    @classmethod
    def transform(cls, data):
        data["labels"] = list(
            filter(
                lambda x: x is not None
                and "label" in x
                and x["label"] is not None
                and x["label"] != {},
                data.get("labels", []),
            )
        )

        return data
