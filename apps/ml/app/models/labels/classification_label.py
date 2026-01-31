from pydantic import BaseModel

from .label import Label


class ClassificationLabel(BaseModel):
    label: Label

    def to_str(self, width: int, height: int) -> str:
        return f"{self.label.id}"
