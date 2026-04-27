"""Detect the ONNX output layout and normalize it to the standard
Ultralytics seg shape: output0=(1, 4+nc+nm, anchors), output1=(1, nm, mh, mw).

Two layouts are supported:
  - "ultralytics": one 3D detection output and one 4D prototype output.
    Returned as-is.
  - "luxonis_split": graph-surgery output from luxonis/tools where each
    stride has its own (1, 4+nc, H, W) detection head and (1, 32, H, W)
    mask-coeff head, plus one (1, 32, mh, mw) prototype output. Strides are
    matched by name prefix (output1_*, output2_*, output3_*) and reassembled
    into the standard shape so the existing decoder doesn't need to know
    about the split.
"""

import re
from typing import Literal

import numpy as np

OutputLayout = Literal["ultralytics", "luxonis_split"]


def detect_layout(output_names: list[str]) -> OutputLayout:
    if any("_yolov8" in n for n in output_names):
        return "luxonis_split"
    return "ultralytics"


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
