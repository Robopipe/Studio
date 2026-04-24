from ..base_schema import BaseSchema

from .label import Label


class RectangleLabel(BaseSchema):
    label: Label
    x: float
    y: float
    width: float
    height: float

    def __get_normalized_coordinates(
        self, image_width: int, image_height: int
    ) -> tuple[float, float, float, float]:
        x_center = (self.x + self.width / 2) / 100
        y_center = (self.y + self.height / 2) / 100
        return x_center, y_center, self.width / 100, self.height / 100

    def to_str(self, image_width: int, image_height: int) -> str:
        x_center, y_center, norm_width, norm_height = self.__get_normalized_coordinates(
            image_width, image_height
        )
        return f"{self.label.label_number} {x_center:.6f} {y_center:.6f} {norm_width:.6f} {norm_height:.6f}"
