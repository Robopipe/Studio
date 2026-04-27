from dataclasses import dataclass

import cv2
import numpy as np


@dataclass
class LetterboxMeta:
    ratio: float
    pad_x: float
    pad_y: float


def letterbox(
    img_bgr: np.ndarray,
    target: tuple[int, int] = (640, 640),
    color: tuple[int, int, int] = (114, 114, 114),
) -> tuple[np.ndarray, LetterboxMeta]:
    h, w = img_bgr.shape[:2]
    th, tw = target
    ratio = min(tw / w, th / h)
    new_w, new_h = int(round(w * ratio)), int(round(h * ratio))
    pad_x = (tw - new_w) / 2
    pad_y = (th - new_h) / 2

    if (w, h) != (new_w, new_h):
        img_bgr = cv2.resize(img_bgr, (new_w, new_h), interpolation=cv2.INTER_LINEAR)

    top = int(round(pad_y - 0.1))
    bottom = int(round(pad_y + 0.1))
    left = int(round(pad_x - 0.1))
    right = int(round(pad_x + 0.1))
    padded = cv2.copyMakeBorder(
        img_bgr, top, bottom, left, right, cv2.BORDER_CONSTANT, value=color
    )
    return padded, LetterboxMeta(ratio=ratio, pad_x=pad_x, pad_y=pad_y)


def preprocess(
    img_bgr: np.ndarray, target: tuple[int, int] = (640, 640)
) -> tuple[np.ndarray, LetterboxMeta]:
    padded, meta = letterbox(img_bgr, target)
    rgb = cv2.cvtColor(padded, cv2.COLOR_BGR2RGB)
    tensor = rgb.astype(np.float32) / 255.0
    tensor = tensor.transpose(2, 0, 1)[None]
    return np.ascontiguousarray(tensor), meta
