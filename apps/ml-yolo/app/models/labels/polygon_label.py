from ..base_schema import BaseSchema

from .label import Label


class PolygonLabel(BaseSchema):
    label: Label
    points: list[tuple[float, float]]
    group_id: str | None = None

    def __get_normalized_points(
        self, width: int, height: int
    ) -> list[tuple[float, float]]:
        return [(x / 100, y / 100) for x, y in self.points]

    def to_str(self, width: int, height: int) -> str:
        normalized_points = self.__get_normalized_points(width, height)
        points_str = " ".join(f"{x:.6f} {y:.6f}" for x, y in normalized_points)
        return f"{self.label.label_number} {points_str}"

    def to_bbox_str(self, width: int, height: int) -> str:
        """Convert polygon to YOLO bbox format (cx, cy, w, h) normalized."""
        normalized_points = self.__get_normalized_points(width, height)
        xs = [x for x, y in normalized_points]
        ys = [y for x, y in normalized_points]
        x_min = max(0.0, min(xs))
        x_max = min(1.0, max(xs))
        y_min = max(0.0, min(ys))
        y_max = min(1.0, max(ys))
        cx = (x_min + x_max) / 2
        cy = (y_min + y_max) / 2
        w = x_max - x_min
        h = y_max - y_min
        return f"{self.label.label_number} {cx:.6f} {cy:.6f} {w:.6f} {h:.6f}"
