from ..base_schema import BaseSchema

from .label import Label


class PolygonLabel(BaseSchema):
    label: Label
    points: list[tuple[int, int]]

    def __get_normalized_points(
        self, width: int, height: int
    ) -> list[tuple[float, float]]:
        return [(x / width, y / height) for x, y in self.points]

    def to_str(self, width: int, height: int) -> str:
        normalized_points = self.__get_normalized_points(width, height)
        points_str = " ".join(f"{x:.6f} {y:.6f}" for x, y in normalized_points)
        return f"{self.label.id} {points_str}"
