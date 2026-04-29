import cv2
import numpy as np

PALETTE = [
    (255, 56, 56),
    (255, 159, 56),
    (255, 252, 56),
    (138, 255, 56),
    (56, 255, 121),
    (56, 255, 245),
    (56, 161, 255),
    (138, 56, 255),
    (245, 56, 255),
    (255, 56, 168),
]


def draw_polygons(
    img_bgr: np.ndarray,
    polygons: list[dict],
    class_names: list[str],
    alpha: float = 0.4,
) -> np.ndarray:
    if not polygons:
        return img_bgr.copy()

    overlay = img_bgr.copy()
    for poly in polygons:
        color = PALETTE[poly["classIndex"] % len(PALETTE)]
        pts = np.array(poly["value"], dtype=np.int32)
        cv2.fillPoly(overlay, [pts], color)
    blended = cv2.addWeighted(overlay, alpha, img_bgr, 1 - alpha, 0)

    for poly in polygons:
        idx = poly["classIndex"]
        color = PALETTE[idx % len(PALETTE)]
        pts = np.array(poly["value"], dtype=np.int32)
        cv2.polylines(blended, [pts], isClosed=True, color=color, thickness=2)

        name = class_names[idx] if idx < len(class_names) else str(idx)
        label = f"{name} {poly['score']:.2f}"
        x, y = pts[0]
        text_y = max(int(y) - 6, 14)
        (tw, th), _ = cv2.getTextSize(
            label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 1
        )
        cv2.rectangle(
            blended,
            (int(x), text_y - th - 4),
            (int(x) + tw + 4, text_y + 2),
            color,
            -1,
        )
        cv2.putText(
            blended,
            label,
            (int(x) + 2, text_y - 2),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            (0, 0, 0),
            1,
            cv2.LINE_AA,
        )
    return blended
