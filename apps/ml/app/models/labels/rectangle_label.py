from ..base_schema import BaseSchema

from .label import Label


class RectangleLabel(BaseSchema):
    label: Label
    x: int
    y: int
    width: int
    height: int

    def __get_normalized_coordinates(
        self, image_width: int, image_height: int
    ) -> tuple[float, float, float, float]:
        x_center = (self.x + self.width / 2) / image_width
        y_center = (self.y + self.height / 2) / image_height
        norm_width = self.width / image_width
        norm_height = self.height / image_height
        return x_center, y_center, norm_width, norm_height

    def to_str(self, image_width: int, image_height: int) -> str:
        x_center, y_center, norm_width, norm_height = self.__get_normalized_coordinates(
            image_width, image_height
        )
        return f"{self.label.id} {x_center:.6f} {y_center:.6f} {norm_width:.6f} {norm_height:.6f}"
