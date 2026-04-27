import cv2
import numpy as np

from .preprocess import LetterboxMeta


def decode_yolo_seg(
    output0: np.ndarray,
    output1: np.ndarray,
    n_classes: int,
    img_shape: tuple[int, int],
    input_shape: tuple[int, int],
    letterbox_meta: LetterboxMeta,
    conf_threshold: float = 0.25,
    iou_threshold: float = 0.45,
    max_det: int = 300,
    mask_threshold: float = 0.5,
    poly_epsilon: float = 0.005,
    min_area_px: float = 4.0,
) -> list[dict]:
    """Decode Ultralytics YOLOv8/v11 segmentation outputs into image-space polygons.

    output0: (1, 4 + n_classes + n_masks, anchors) — boxes (xywh, model-input
             pixel coords), per-class scores, and mask coefficients.
    output1: (1, n_masks, mh, mw) — prototype masks. The per-detection mask is
             sigmoid(coeffs @ proto), cropped to the box, then un-letterboxed
             back into the original image.
    """
    preds = output0[0].T
    n_masks = preds.shape[1] - 4 - n_classes
    if n_masks <= 0:
        raise ValueError(
            f"output0 last-dim={preds.shape[1]} is too small for n_classes={n_classes}"
        )

    boxes_xywh = preds[:, :4]
    class_scores = preds[:, 4 : 4 + n_classes]
    mask_coeffs = preds[:, 4 + n_classes :]

    scores = class_scores.max(axis=1)
    class_ids = class_scores.argmax(axis=1)

    keep = scores >= conf_threshold
    if not keep.any():
        return []

    boxes_xywh = boxes_xywh[keep]
    scores = scores[keep]
    class_ids = class_ids[keep]
    mask_coeffs = mask_coeffs[keep]

    cx, cy, w, h = boxes_xywh.T
    boxes_xyxy = np.stack(
        [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2], axis=1
    )

    # cv2.dnn.NMSBoxes expects xywh with top-left origin.
    nms_boxes = np.stack([cx - w / 2, cy - h / 2, w, h], axis=1).tolist()
    indices = cv2.dnn.NMSBoxes(
        nms_boxes, scores.tolist(), conf_threshold, iou_threshold
    )
    if len(indices) == 0:
        return []
    indices = np.array(indices).flatten()[:max_det]

    boxes_xyxy = boxes_xyxy[indices]
    scores = scores[indices]
    class_ids = class_ids[indices]
    mask_coeffs = mask_coeffs[indices]

    proto = output1[0]
    nm, mh, mw = proto.shape
    proto_flat = proto.reshape(nm, -1).astype(np.float32)
    raw = mask_coeffs.astype(np.float32) @ proto_flat
    masks = _sigmoid(raw).reshape(-1, mh, mw)

    in_h, in_w = input_shape
    orig_h, orig_w = img_shape
    pad_x = letterbox_meta.pad_x
    pad_y = letterbox_meta.pad_y

    polygons: list[dict] = []
    for i, mask in enumerate(masks):
        full = cv2.resize(mask, (in_w, in_h), interpolation=cv2.INTER_LINEAR)

        x1, y1, x2, y2 = boxes_xyxy[i]
        x1i = max(0, int(np.floor(x1)))
        y1i = max(0, int(np.floor(y1)))
        x2i = min(in_w, int(np.ceil(x2)))
        y2i = min(in_h, int(np.ceil(y2)))
        if x2i <= x1i or y2i <= y1i:
            continue

        cropped = np.zeros_like(full, dtype=np.float32)
        cropped[y1i:y2i, x1i:x2i] = full[y1i:y2i, x1i:x2i]

        # Strip the letterbox padding, then resize the unpadded slice back
        # to the original image dimensions.
        py0 = int(round(pad_y))
        px0 = int(round(pad_x))
        py1 = in_h - py0
        px1 = in_w - px0
        unpadded = cropped[py0:py1, px0:px1]
        if unpadded.size == 0:
            continue
        full_size = cv2.resize(
            unpadded, (orig_w, orig_h), interpolation=cv2.INTER_LINEAR
        )
        binary = (full_size > mask_threshold).astype(np.uint8)

        contours, _ = cv2.findContours(
            binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE
        )
        if not contours:
            continue
        contour = max(contours, key=cv2.contourArea)
        if cv2.contourArea(contour) < min_area_px:
            continue

        epsilon = poly_epsilon * cv2.arcLength(contour, True)
        simplified = cv2.approxPolyDP(contour, epsilon, True).reshape(-1, 2)
        if len(simplified) < 3:
            continue

        polygons.append(
            {
                "classIndex": int(class_ids[i]),
                "score": float(scores[i]),
                "value": simplified.astype(int).tolist(),
            }
        )

    return polygons


def _sigmoid(x: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-x))
