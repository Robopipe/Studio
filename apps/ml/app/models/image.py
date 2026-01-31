from typing import Union

from pydantic import BaseModel
from .labels.classification_label import ClassificationLabel
from .labels.polygon_label import PolygonLabel
from .labels.rectangle_label import RectangleLabel


class Image(BaseModel):
    file_url: str
    width: int
    height: int
    labels: list[Union[ClassificationLabel, PolygonLabel, RectangleLabel]]

    def labels_str(self) -> list[str]:
        result = []
        for label in self.labels:
            if isinstance(label, ClassificationLabel):
                result.append(label.to_str())
            elif isinstance(label, PolygonLabel):
                result.append(label.to_str(self.width, self.height))
            elif isinstance(label, RectangleLabel):
                result.append(label.to_str(self.width, self.height))
        return result
