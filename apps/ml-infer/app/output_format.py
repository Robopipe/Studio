"""Detect the ONNX output layout and normalize it.

Segmentation (normalize_outputs → (output0, output1)):
  - "ultralytics": one 3D detection output and one 4D prototype output.
  - "luxonis_split": per-stride 4D detection heads + mask-coeff heads +
    one prototype, reassembled into the standard shape.

Detection (normalize_det_outputs → output0 only):
  - "ultralytics_det": single (1, 4+nc, anchors) 3D output, no protos.
  - "luxonis_split_det": per-stride (1, 5+nc, H, W) *_yolov8 heads,
    LTRB + injected objectness slot + classes. Reassembled to (1, 4+nc, anchors).
  - "luxonis_plain_det": per-stride (1, 5+nc, H, W) heads with generic names
    (output0/1/2). Same LTRB+obj+cls layout as luxonis_split_det but output
    node names were not renamed by luxonis-tools. Produced by luxonis-train
    when the NN-archive ONNX keeps the original PyTorch export node names.
"""

import re
from typing import Literal

import numpy as np

OutputLayout = Literal["ultralytics", "luxonis_split"]
DetOutputLayout = Literal["ultralytics_det", "luxonis_split_det", "luxonis_plain_det"]


def detect_layout(output_names: list[str]) -> OutputLayout:
    if any("_yolov8" in n for n in output_names):
        return "luxonis_split"
    return "ultralytics"


def detect_det_layout(
    output_names: list[str], outputs: list[np.ndarray]
) -> DetOutputLayout:
    if any("_yolov8" in n for n in output_names):
        return "luxonis_split_det"
    # Multiple 4D outputs with no _yolov8 names → luxonis-train plain export
    if sum(1 for o in outputs if o.ndim == 4) > 1:
        return "luxonis_plain_det"
    return "ultralytics_det"


def _decode_ltrb_strides(
    stride_outputs: list[np.ndarray],
    input_shape: tuple[int, int],
    has_objectness_slot: bool,
) -> np.ndarray:
    """LTRB per-stride decode → (1, 4+nc, total_anchors)."""
    in_h, in_w = input_shape
    decoded_chunks: list[np.ndarray] = []
    cls_start = 5 if has_objectness_slot else 4
    for y in stride_outputs:
        _, _, h, w = y.shape
        stride_y = in_h // h
        stride_x = in_w // w
        ltrb = y[0, :4]
        cls = y[0, cls_start:]
        gy, gx = np.meshgrid(
            np.arange(h, dtype=np.float32),
            np.arange(w, dtype=np.float32),
            indexing="ij",
        )
        cx_anchor = (gx + 0.5) * stride_x
        cy_anchor = (gy + 0.5) * stride_y
        x1 = cx_anchor - ltrb[0] * stride_x
        y1 = cy_anchor - ltrb[1] * stride_y
        x2 = cx_anchor + ltrb[2] * stride_x
        y2 = cy_anchor + ltrb[3] * stride_y
        cx = (x1 + x2) * 0.5
        cy = (y1 + y2) * 0.5
        bw = x2 - x1
        bh = y2 - y1
        box_xywh = np.stack([cx, cy, bw, bh], axis=0)
        decoded = np.concatenate([box_xywh, cls], axis=0)[None]
        decoded_chunks.append(decoded.reshape(1, decoded.shape[1], h * w))
    return np.concatenate(decoded_chunks, axis=2)


def normalize_det_outputs(
    outputs: list[np.ndarray],
    output_names: list[str],
    input_shape: tuple[int, int],
) -> np.ndarray:
    """Normalize detection outputs to (1, 4+nc, anchors)."""
    layout = detect_det_layout(output_names, outputs)
    by_name = dict(zip(output_names, outputs))

    if layout == "ultralytics_det":
        candidates_3d = [o for o in outputs if o.ndim == 3]
        if not candidates_3d:
            raise ValueError(
                f"ultralytics_det layout: expected a 3D output, got shapes "
                f"{[o.shape for o in outputs]}"
            )
        return candidates_3d[0]

    if layout == "luxonis_plain_det":
        # Per-stride 4D outputs with generic names, same LTRB+obj+cls layout
        # as luxonis_split_det. Sort by spatial resolution: large → small.
        stride_outputs = sorted(
            [o for o in outputs if o.ndim == 4], key=lambda o: -o.shape[2]
        )
        return _decode_ltrb_strides(stride_outputs, input_shape, has_objectness_slot=True)

    # luxonis_split_det: _yolov8-named heads
    yolo_keys = sorted(
        (k for k in by_name if "_yolov8" in k), key=_stride_index
    )
    if not yolo_keys:
        raise ValueError(
            f"luxonis_split_det layout: no *_yolov8 outputs found; got {output_names}"
        )
    stride_outputs = [by_name[k] for k in yolo_keys]
    return _decode_ltrb_strides(stride_outputs, input_shape, has_objectness_slot=True)


def normalize_outputs(
    outputs: list[np.ndarray],
    output_names: list[str],
    input_shape: tuple[int, int],
) -> tuple[np.ndarray, np.ndarray]:
    layout = detect_layout(output_names)
    by_name = dict(zip(output_names, outputs))

    if layout == "ultralytics":
        output0 = next(o for o in outputs if o.ndim == 3)
        output1 = next(o for o in outputs if o.ndim == 4)
        return output0, output1

    yolo_keys = sorted(
        (k for k in by_name if "_yolov8" in k), key=_stride_index
    )
    mask_keys = sorted(
        (k for k in by_name if "_masks" in k and "protos" not in k),
        key=_stride_index,
    )
    proto_keys = [k for k in by_name if "protos" in k]
    if not proto_keys:
        raise ValueError(
            f"luxonis-split layout missing prototype output; got {output_names}"
        )
    if len(yolo_keys) != len(mask_keys):
        raise ValueError(
            f"luxonis-split detection/mask head count mismatch: "
            f"{yolo_keys} vs {mask_keys}"
        )

    in_h, in_w = input_shape
    decoded_chunks: list[np.ndarray] = []
    coeff_chunks: list[np.ndarray] = []
    for ykey, mkey in zip(yolo_keys, mask_keys):
        y = by_name[ykey]  # (1, 4+nc, H, W)
        m = by_name[mkey]  # (1, 32, H, W)
        _, c_y, h, w = y.shape
        _, c_m, _, _ = m.shape
        if in_h % h != 0 or in_w % w != 0:
            raise ValueError(
                f"input {input_shape} not divisible by feature map ({h}, {w})"
            )
        stride_y = in_h // h
        stride_x = in_w // w

        # luxonis/tools strips dist2bbox from the graph. Channels are:
        #   0..3   LTRB distances from each cell center, in stride units
        #   4      injected constant-1.0 objectness slot (for parser compat)
        #   5..    per-class sigmoid scores
        ltrb = y[0, :4]
        cls = y[0, 5:]
        gy, gx = np.meshgrid(
            np.arange(h, dtype=np.float32),
            np.arange(w, dtype=np.float32),
            indexing="ij",
        )
        cx_anchor = (gx + 0.5) * stride_x
        cy_anchor = (gy + 0.5) * stride_y
        x1 = cx_anchor - ltrb[0] * stride_x
        y1 = cy_anchor - ltrb[1] * stride_y
        x2 = cx_anchor + ltrb[2] * stride_x
        y2 = cy_anchor + ltrb[3] * stride_y
        cx = (x1 + x2) * 0.5
        cy = (y1 + y2) * 0.5
        bw = x2 - x1
        bh = y2 - y1
        box_xywh = np.stack([cx, cy, bw, bh], axis=0)  # (4, H, W)
        decoded = np.concatenate([box_xywh, cls], axis=0)[None]  # (1, 4+nc, H, W)
        decoded_chunks.append(decoded.reshape(1, decoded.shape[1], h * w))
        coeff_chunks.append(m.reshape(1, c_m, h * w))

    box_class_cat = np.concatenate(decoded_chunks, axis=2)
    coeff_cat = np.concatenate(coeff_chunks, axis=2)
    output0 = np.concatenate([box_class_cat, coeff_cat], axis=1)
    output1 = by_name[proto_keys[0]]
    return output0, output1


def _stride_index(name: str) -> int:
    m = re.search(r"output(\d+)", name)
    return int(m.group(1)) if m else 0
