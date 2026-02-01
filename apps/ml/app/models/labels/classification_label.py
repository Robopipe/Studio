from ..base_schema import BaseSchema
from .label import Label


class ClassificationLabel(BaseSchema):
    label: Label

    def to_str(self, width: int, height: int) -> str:
        return f"{self.label.label_number}"
