import cv2
import numpy as np

from ..base_schema import BaseSchema

from .label import Label

# Components smaller than this fraction of the opened polygon's area are
# discarded — they're almost always rasterisation noise rather than real
# pieces of the object.
_MIN_COMPONENT_AREA_RATIO = 0.05


class PolygonLabel(BaseSchema):
    label: Label
    points: list[tuple[float, float]]

    # Points are stored in percentage space (0-100); YOLO label files want
    # 0-1 normalised coords. Width/height are unused at the normalisation
    # step but kept in the signature for symmetry with other label types.
    def __normalized_points(self) -> list[tuple[float, float]]:
        return [(x / 100, y / 100) for x, y in self.points]

    def __split_components(
        self, width: int, height: int, kernel_size: int
    ) -> list[list[tuple[float, float]]]:
        """Rasterise the polygon, apply a morphological opening to break thin
        bridges between visually-disconnected pieces, and emit one polygon
        (in normalised 0-1 coords) per surviving connected component.

        Falls back to the original polygon when the opening leaves a single
        component, when the polygon is degenerate, or when any geometry step
        would otherwise produce no usable contour.
        """
        if width <= 0 or height <= 0 or kernel_size <= 0:
            return [self.__normalized_points()]

        if len(self.points) < 3:
            return [self.__normalized_points()]

        pixel_pts = np.array(
            [
                (int(round((x / 100) * width)), int(round((y / 100) * height)))
                for x, y in self.points
            ],
            dtype=np.int32,
        )

        mask = np.zeros((height, width), dtype=np.uint8)
        cv2.fillPoly(mask, [pixel_pts], 255)

        kernel = cv2.getStructuringElement(
            cv2.MORPH_ELLIPSE, (kernel_size, kernel_size)
        )
        opened = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

        num_labels, comp_labels = cv2.connectedComponents(opened)
        # num_labels counts background as label 0, so <= 2 means at most one
        # real component survived the opening — no split happened.
        if num_labels <= 2:
            return [self.__normalized_points()]

        total_area = int(np.count_nonzero(opened))
        if total_area == 0:
            return [self.__normalized_points()]

        out: list[list[tuple[float, float]]] = []
        for cid in range(1, num_labels):
            comp = np.where(comp_labels == cid, 255, 0).astype(np.uint8)
            comp_area = int(np.count_nonzero(comp))
            if comp_area < _MIN_COMPONENT_AREA_RATIO * total_area:
                continue
            contours, _ = cv2.findContours(
                comp, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_TC89_KCOS
            )
            if not contours:
                continue
            biggest = max(contours, key=cv2.contourArea).squeeze()
            if biggest.ndim != 2 or biggest.shape[0] < 3:
                continue
            out.append(
                [(float(p[0]) / width, float(p[1]) / height) for p in biggest]
            )

        return out or [self.__normalized_points()]

    def __seg_line(self, normalized_points: list[tuple[float, float]]) -> str:
        points_str = " ".join(f"{x:.6f} {y:.6f}" for x, y in normalized_points)
        return f"{self.label.label_number} {points_str}"

    def __bbox_line(self, normalized_points: list[tuple[float, float]]) -> str:
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

    def __resolve_polygons(
        self, width: int, height: int, split_kernel_size: int | None
    ) -> list[list[tuple[float, float]]]:
        if split_kernel_size:
            return self.__split_components(width, height, split_kernel_size)
        return [self.__normalized_points()]

    def to_str_lines(
        self, width: int, height: int, split_kernel_size: int | None = None
    ) -> list[str]:
        polygons = self.__resolve_polygons(width, height, split_kernel_size)
        return [self.__seg_line(p) for p in polygons]

    def to_bbox_str_lines(
        self, width: int, height: int, split_kernel_size: int | None = None
    ) -> list[str]:
        polygons = self.__resolve_polygons(width, height, split_kernel_size)
        return [self.__bbox_line(p) for p in polygons]

    # Backwards-compatible single-string accessors. The split-aware caller
    # (Image.labels_str) uses the *_lines variants directly; these remain
    # for any other consumers that expect a single label string.
    def to_str(self, width: int, height: int) -> str:
        return self.to_str_lines(width, height)[0]

    def to_bbox_str(self, width: int, height: int) -> str:
        return self.to_bbox_str_lines(width, height)[0]
