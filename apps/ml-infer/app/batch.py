"""Batch entrypoint for the Confidence Report.

Reads a signed config URL from $CONFIG_URL, loads the ONNX model once,
runs detection/segmentation on every project task, computes per-task and
per-class metrics, and reports results back to the API via webhook.

Run as:  python -m app.batch

Env vars
--------
CONFIG_URL    Signed GCS URL for the JSON job config written by the API.
API_KEY       API secret — echoed as the Authorization header on webhooks.

Config JSON shape
-----------------
{
  "reportId": int,
  "projectId": int,
  "modelUrl": str,       # signed GCS URL for the RAW ONNX archive
  "modelId": int,
  "conf": float,
  "iou": float,          # NMS IoU threshold (same as pre-annotate)
  "matchIou": float,     # TP matching IoU threshold (default 0.5)
  "gtGeometry": "RECTANGLE" | "POLYGON",
  "modelType": "detection" | "segmentation",  # decides the decode path;
                         # older configs lack it (fall back to gtGeometry)
  "labelIds": [int, ...],   # ordered by labelId ASC (== ONNX class index)
  "labelNames": [str, ...],
  "labelColors": [str, ...],
  "tasks": [
    {
      "taskId": int,
      "imageUrl": str,
      "width": int,          # original image width in pixels
      "height": int,
      "hasGt": bool,         # whether GT of requested geometry exists
      "annotated": bool,     # whether the task was annotated (status DONE);
                             # unannotated tasks get no IoU/precision/recall
                             # and are excluded from dataset-level P/R
      "gt": [
        # detection GT (gtGeometry == RECTANGLE):
        {"labelId": int, "box": {"x", "y", "width", "height"}}   # percentages 0-100
        # segmentation / polygon GT (gtGeometry == POLYGON):
        {"labelId": int, "polygon": [[x, y], ...]}               # percentages 0-100
      ]
    }, ...
  ],
  "progressChunkSize": int,
  "webhookUrl": str          # base URL (without trailing slash)
}

Metrics
-------
* meanConfidence — mean score over all kept detections in the task (null if none).
* meanIou        — mean matched-TP IoU on this task (null if no TP match).
* precision      — micro-averaged precision for the task: TP/(TP+FP). Null when
                   the model made no predictions (TP+FP=0). 0 when all predictions
                   are false positives.
* recall         — micro-averaged recall for the task: TP/(TP+FN). Null when the
                   task has no ground-truth objects. 0 when the model missed all GT.
* Unannotated tasks (annotated == false) report null meanIou/precision/recall —
  their GT is unknown, not empty — and contribute nothing to dataset-level P/R.
  Their detections still count toward the per-class confidence box-stats.
* Per-class box-stats for confidence scores and matched-TP IoU values are
  accumulated and sent in the final complete webhook, together with overall
  dataset-level precision and recall (micro over all tasks).
"""

import json
import logging
import os
import queue
import ssl
import sys
import threading
import traceback
import urllib.request
from typing import Optional

import certifi
import numpy as np

from .cache import ModelCache
from .image_io import fetch_image
from .output_format import normalize_det_outputs, normalize_outputs
from .postprocess import decode_yolo_det, decode_yolo_seg
from .preprocess import preprocess

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(name)s  %(message)s",
)
_log = logging.getLogger("ml-infer.batch")

_SSL_CONTEXT = ssl.create_default_context(cafile=certifi.where())
DEFAULT_IOU_MATCH_THRESHOLD = 0.5


# ─── HTTP helpers ─────────────────────────────────────────────────────────────

def _post_json(url: str, payload: dict) -> None:
    """POST a JSON payload to url, raising on non-2xx."""
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        url,
        data=data,
        method="POST",
        headers={
            "Content-Type": "application/json",
            # Read lazily so the HTTP-dispatch path in server.py can set
            # os.environ["API_KEY"] after module import.
            "Authorization": os.environ.get("API_KEY", ""),
        },
    )
    with urllib.request.urlopen(req, timeout=30, context=_SSL_CONTEXT) as resp:
        if resp.status >= 300:
            raise RuntimeError(f"Webhook POST {url} returned HTTP {resp.status}")


def _fetch_config(config_url: str) -> dict:
    if config_url.startswith("file://"):
        # Local-dev path: read directly from disk.
        path = config_url[len("file://"):]
        with open(path) as f:
            return json.load(f)
    req = urllib.request.Request(
        config_url, headers={"User-Agent": "ml-infer-batch/0.1"}
    )
    with urllib.request.urlopen(req, timeout=60, context=_SSL_CONTEXT) as resp:
        return json.loads(resp.read())


# ─── IoU helpers ──────────────────────────────────────────────────────────────

def _box_iou(
    pred: tuple[float, float, float, float],
    gt: tuple[float, float, float, float],
) -> float:
    """Axis-aligned box IoU. Boxes are (x, y, w, h) in the same coord space."""
    px, py, pw, ph = pred
    gx, gy, gw, gh = gt

    px2, py2 = px + pw, py + ph
    gx2, gy2 = gx + gw, gy + gh

    ix1 = max(px, gx)
    iy1 = max(py, gy)
    ix2 = min(px2, gx2)
    iy2 = min(py2, gy2)

    inter = max(0.0, ix2 - ix1) * max(0.0, iy2 - iy1)
    if inter == 0.0:
        return 0.0

    pred_area = pw * ph
    gt_area = gw * gh
    union = pred_area + gt_area - inter
    return inter / union if union > 0 else 0.0


def _polygon_iou(
    pred_pts: list[tuple[float, float]],
    gt_pts: list[tuple[float, float]],
) -> float:
    """IoU between two polygons using shapely (available in batch requirements)."""
    try:
        from shapely.geometry import Polygon
        from shapely.errors import TopologicalError
    except ImportError:
        # Fallback: use bounding boxes of the polygon vertices.
        _log.warning("shapely not available — falling back to bbox IoU for polygon matching")
        xs_p, ys_p = zip(*pred_pts)
        xs_g, ys_g = zip(*gt_pts)
        pred_box = (min(xs_p), min(ys_p), max(xs_p) - min(xs_p), max(ys_p) - min(ys_p))
        gt_box = (min(xs_g), min(ys_g), max(xs_g) - min(xs_g), max(ys_g) - min(ys_g))
        return _box_iou(pred_box, gt_box)

    try:
        p = Polygon(pred_pts).buffer(0)
        g = Polygon(gt_pts).buffer(0)
        if not p.is_valid or not g.is_valid or p.is_empty or g.is_empty:
            return 0.0
        inter = p.intersection(g).area
        union = p.union(g).area
        return inter / union if union > 0 else 0.0
    except (TopologicalError, Exception):
        return 0.0


def _polygon_to_box(pts: list[tuple[float, float]]) -> tuple[float, float, float, float]:
    """Bounding box of polygon vertices: (x, y, w, h)."""
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    x, y = min(xs), min(ys)
    return x, y, max(xs) - x, max(ys) - y


# ─── Greedy matching ──────────────────────────────────────────────────────────

def _match_detections(
    predictions: list[dict],  # [{classIndex, score, ...}]
    gt: list[dict],           # [{labelId, annotationId?, box|polygon}]
    label_ids: list[int],
    gt_geometry: str,
    img_w: int,
    img_h: int,
    model_type: str,          # "detection" or "segmentation"
    match_iou: float = DEFAULT_IOU_MATCH_THRESHOLD,
) -> tuple[list[float], list[float], list[float]]:
    """Greedy matching of predictions to GT at IoU ≥ match_iou.

    Side-effect: stamps matched true-positive predictions with two private keys:
        _matched_iou           — float IoU of the TP match
        _matched_annotation_id — int DB id of the matched GT annotation (may be None)
    False-positive predictions are not stamped (keys absent).

    Returns:
        per_class — list of (classIndex, score, matched_iou_or_None) tuples
    """
    # Sort predictions by descending confidence.
    preds = sorted(predictions, key=lambda p: p["score"], reverse=True)

    # Convert GT to pixel space; store (geometry, annotationId) pairs per label.
    # Each entry: (box_tuple_or_pts_list, annotation_id_or_None)
    gt_boxes_by_label: dict[int, list[tuple]] = {}
    gt_polys_by_label: dict[int, list[tuple]] = {}

    for g in gt:
        lid = g["labelId"]
        ann_id = g.get("annotationId")
        if gt_geometry == "RECTANGLE":
            b = g["box"]
            px = b["x"] * img_w / 100.0
            py = b["y"] * img_h / 100.0
            pw = b["width"] * img_w / 100.0
            ph = b["height"] * img_h / 100.0
            gt_boxes_by_label.setdefault(lid, []).append(((px, py, pw, ph), ann_id))
        else:  # POLYGON
            pts = [(p[0] * img_w / 100.0, p[1] * img_h / 100.0) for p in g["polygon"]]
            gt_polys_by_label.setdefault(lid, []).append((pts, ann_id))

    matched_gt: dict[int, set[int]] = {}  # labelId → set of matched GT indices
    per_class_results: list[tuple[int, float, Optional[float]]] = []

    for pred in preds:
        ci = pred["classIndex"]
        if ci < 0 or ci >= len(label_ids):
            continue
        lid = label_ids[ci]
        score = float(pred["score"])

        # Build the prediction geometry in pixels.
        if model_type == "detection":
            pred_box = (float(pred["x"]), float(pred["y"]), float(pred["width"]), float(pred["height"]))
        else:
            pred_pts = pred["value"]

        matched_iou: Optional[float] = None

        # Try to match to an unmatched GT object of the same class.
        if model_type == "detection":
            gt_boxes = gt_boxes_by_label.get(lid, [])
            used = matched_gt.setdefault(lid, set())
            best_iou = 0.0
            best_idx = -1
            for gi, (gt_box, _ann_id) in enumerate(gt_boxes):
                if gi in used:
                    continue
                iou = _box_iou(pred_box, gt_box)
                if iou > best_iou:
                    best_iou = iou
                    best_idx = gi
            if best_iou >= match_iou:
                matched_gt[lid].add(best_idx)
                matched_iou = best_iou
                # Stamp the prediction dict (same object as in `predictions` list).
                pred["_matched_iou"] = matched_iou
                pred["_matched_annotation_id"] = gt_boxes[best_idx][1]
        else:
            # Segmentation: compare polygons.
            gt_polys = gt_polys_by_label.get(lid, [])
            used = matched_gt.setdefault(lid, set())
            best_iou = 0.0
            best_idx = -1
            for gi, (gt_poly, _ann_id) in enumerate(gt_polys):
                if gi in used:
                    continue
                iou = _polygon_iou(pred_pts, gt_poly)
                if iou > best_iou:
                    best_iou = iou
                    best_idx = gi
            if best_iou >= match_iou:
                matched_gt[lid].add(best_idx)
                matched_iou = best_iou
                # Stamp the prediction dict (same object as in `predictions` list).
                pred["_matched_iou"] = matched_iou
                pred["_matched_annotation_id"] = gt_polys[best_idx][1]

        per_class_results.append((ci, score, matched_iou))

    return per_class_results


def _task_metrics(
    per_class_results: list[tuple[int, float, Optional[float]]],
    total_gt: int,
) -> tuple[Optional[float], Optional[float], Optional[float], Optional[float], int, int, int]:
    """Compute per-task metrics from matching results.

    Returns:
        (meanConfidence, meanIou, precision, recall, tp, fp, fn)

    Precision/recall are micro-averaged across all classes on the image.
    Precision is None when there are no predictions at all (TP+FP=0).
    Recall is None when there is no ground truth (total_gt == 0).
    """
    tp = sum(1 for _, _, iou in per_class_results if iou is not None)
    fp = len(per_class_results) - tp
    fn = max(0, total_gt - tp)

    scores = [s for _, s, _ in per_class_results]
    mean_conf = float(np.mean(scores)) if scores else None

    tp_ious = [iou for _, _, iou in per_class_results if iou is not None]
    mean_iou = float(np.mean(tp_ious)) if tp_ious else None

    # Null when no predictions; 0 when all predictions are false positives.
    precision: Optional[float] = tp / (tp + fp) if (tp + fp) > 0 else None
    # Null when no GT; 0 when model missed all GT objects.
    recall: Optional[float] = tp / (tp + fn) if (tp + fn) > 0 else None

    return mean_conf, mean_iou, precision, recall, tp, fp, fn


# ─── Box-stats helper (mirrors the SQL percentile_cont + IQR logic) ───────────

def _box_stats(values: list[float]) -> Optional[dict]:
    if not values:
        return None
    arr = np.array(values, dtype=float)
    q1, median, q3 = float(np.percentile(arr, 25)), float(np.percentile(arr, 50)), float(np.percentile(arr, 75))
    iqr = q3 - q1
    whisker_low = float(np.min(arr[arr >= q1 - 1.5 * iqr])) if iqr > 0 else float(arr.min())
    whisker_high = float(np.max(arr[arr <= q3 + 1.5 * iqr])) if iqr > 0 else float(arr.max())
    outliers = [float(v) for v in arr if v < whisker_low or v > whisker_high]
    return {
        "min": float(arr.min()),
        "q1": q1,
        "median": median,
        "q3": q3,
        "max": float(arr.max()),
        "whiskerLow": whisker_low,
        "whiskerHigh": whisker_high,
        "outliers": outliers[:100],  # cap at 100 for the JSON payload
        "outlierCount": len(outliers),
    }


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    config_url = os.environ.get("CONFIG_URL")
    if not config_url:
        _log.error("CONFIG_URL env var is required")
        sys.exit(1)

    _log.info("fetching job config from GCS")
    cfg = _fetch_config(config_url)

    report_id: int = cfg["reportId"]
    model_url: str = cfg["modelUrl"]
    model_id: int = cfg["modelId"]
    conf: float = cfg["conf"]
    iou_threshold: float = cfg.get("iou", 0.45)
    match_iou: float = cfg.get("matchIou", DEFAULT_IOU_MATCH_THRESHOLD)
    gt_geometry: str = cfg["gtGeometry"]
    label_ids: list[int] = cfg["labelIds"]
    label_names: list[str] = cfg["labelNames"]
    label_colors: list[str] = cfg["labelColors"]
    tasks: list[dict] = cfg["tasks"]
    chunk_size: int = cfg.get("progressChunkSize", 10)
    webhook_url: str = cfg["webhookUrl"].rstrip("/")

    n_classes = len(label_ids)
    # The model's actual type decides the decode path and the geometry of the
    # predicted regions. GT geometry is independent: a detection model can be
    # evaluated against polygon GT (polygons are converted to bounding boxes
    # below). Older configs lack modelType — infer it from gtGeometry, which
    # was the only supported pairing back then.
    model_type: str = cfg.get("modelType") or (
        "detection" if gt_geometry == "RECTANGLE" else "segmentation"
    )
    is_detection = model_type == "detection"
    pred_geometry = "RECTANGLE" if is_detection else "POLYGON"

    # Per-class accumulators: {classIndex: {confidence: [], iou: []}}
    class_confidence: dict[int, list[float]] = {i: [] for i in range(n_classes)}
    class_iou: dict[int, list[float]] = {i: [] for i in range(n_classes)}

    # Dataset-level TP/FP/FN accumulators for overall precision & recall.
    dataset_tp = 0
    dataset_fp = 0
    dataset_fn = 0

    # Load model once (no LRU needed in batch — single job, single model).
    _log.info("loading model %d", model_id)
    cache = ModelCache(capacity=1)
    loaded = cache.get(model_id, model_url)
    session = loaded.session

    inputs = session.get_inputs()
    in_name = inputs[0].name
    in_shape = inputs[0].shape
    in_h = in_shape[2] if isinstance(in_shape[2], int) else 640
    in_w = in_shape[3] if isinstance(in_shape[3], int) else 640
    output_names = [o.name for o in session.get_outputs()]

    _log.info(
        "model loaded: %d classes, input %dx%d, running %d tasks",
        n_classes, in_h, in_w, len(tasks),
    )

    chunk_results: list[dict] = []
    processed = 0
    total = len(tasks)

    # ─── Prefetch pipeline ──────────────────────────────────────────────
    # Downloading + preprocessing one image at a time left the (GPU) model
    # idle between images. A small thread pool now downloads/preprocesses
    # concurrently (network I/O and OpenCV both release the GIL) into a
    # bounded queue, while a single consumer below runs session.run() back
    # to back so GPU calls stay serialized and never idle on I/O.
    #
    # This does NOT batch multiple images into one session.run() call —
    # exported models have a static batch axis of 1 (see model.py), and
    # pre/postprocessing throughout this module hard-assumes N=1. Each
    # image is still one inference call; only the I/O around it overlaps.
    #
    # The queue is bounded so a fast prefetch pool can't outrun the single
    # inference consumer and pile up preprocessed tensors in memory.
    prefetch_workers = min(int(os.environ.get("CR_PREFETCH_WORKERS", "8")), max(1, total))
    in_queue: "queue.Queue[Optional[dict]]" = queue.Queue()
    out_queue: "queue.Queue[dict]" = queue.Queue(maxsize=max(2, prefetch_workers * 2))

    for task in tasks:
        in_queue.put(task)
    for _ in range(prefetch_workers):
        in_queue.put(None)  # one stop sentinel per worker

    def _prefetch_worker() -> None:
        while True:
            task = in_queue.get()
            if task is None:
                return
            item: dict = {"task": task}
            try:
                img = fetch_image(task["imageUrl"])
                tensor, meta = preprocess(img, (in_h, in_w))
                item["tensor"] = tensor
                item["meta"] = meta
                item["img_shape"] = (img.shape[0], img.shape[1])
            except Exception as exc:
                item["error"] = exc
            out_queue.put(item)

    _log.info("starting inference with %d prefetch worker(s)", prefetch_workers)
    prefetch_threads = [
        threading.Thread(target=_prefetch_worker, daemon=True, name=f"prefetch-{i}")
        for i in range(prefetch_workers)
    ]
    for t in prefetch_threads:
        t.start()

    for _ in range(total):
        item = out_queue.get()
        task = item["task"]
        task_id: int = task["taskId"]
        img_w: int = task["width"]
        img_h: int = task["height"]
        gt: list[dict] = task.get("gt", [])
        annotated: bool = bool(task.get("annotated", True))

        # Initialise to empty; populated only on success so failed tasks
        # contribute no regions (stays empty on exception).
        task_regions: list[dict] = []

        try:
            if "error" in item:
                # Fetch/preprocess failed on the prefetch thread — surface
                # it here so the single except block below handles it the
                # same way as an inference/decode/matching failure.
                raise item["error"]

            tensor = item["tensor"]
            meta = item["meta"]
            fetched_img_h, fetched_img_w = item["img_shape"]
            outputs = session.run(None, {in_name: tensor})

            if is_detection:
                output0 = normalize_det_outputs(outputs, output_names, (in_h, in_w))
                predictions = decode_yolo_det(
                    output0,
                    n_classes=n_classes,
                    img_shape=(fetched_img_h, fetched_img_w),
                    input_shape=(in_h, in_w),
                    letterbox_meta=meta,
                    conf_threshold=conf,
                    iou_threshold=iou_threshold,
                )
            else:
                output0, output1 = normalize_outputs(outputs, output_names, (in_h, in_w))
                predictions = decode_yolo_seg(
                    output0,
                    output1,
                    n_classes=n_classes,
                    img_shape=(fetched_img_h, fetched_img_w),
                    input_shape=(in_h, in_w),
                    letterbox_meta=meta,
                    conf_threshold=conf,
                    iou_threshold=iou_threshold,
                )

            # Detection model + POLYGON gt: evaluate each polygon as its
            # bounding box. Coords stay in percentages (_match_detections
            # converts to pixels); annotationId is preserved so matched TP
            # regions still link to the GT annotation. Degenerate polygons
            # (< 3 points) are dropped.
            effective_gt = gt
            if is_detection and gt_geometry == "POLYGON":
                effective_gt = []
                for g in gt:
                    pts = [(p[0], p[1]) for p in g["polygon"]]
                    if len(pts) >= 3:
                        x, y, w, h = _polygon_to_box(pts)
                        effective_gt.append({
                            "labelId": g["labelId"],
                            "annotationId": g.get("annotationId"),
                            "box": {"x": x, "y": y, "width": w, "height": h},
                        })
                effective_gt_geometry = "RECTANGLE"
            else:
                effective_gt_geometry = gt_geometry

            per_class_results = _match_detections(
                predictions,
                effective_gt,
                label_ids,
                effective_gt_geometry,
                img_w,
                img_h,
                model_type,
                match_iou,
            )

            # Build region payloads after matching so _matched_iou/_matched_annotation_id
            # are already stamped on each TP prediction by _match_detections.
            # Deliberately uses img_h/img_w (declared original dimensions from
            # the task payload), not the fetched image's actual decoded shape.
            for pred in predictions:
                ci = pred["classIndex"]
                if ci < 0 or ci >= n_classes:
                    continue
                region: dict = {
                    "labelId": label_ids[ci],
                    "score": float(pred["score"]),
                    # Geometry of the *prediction*, not the GT: with a
                    # detection model + polygon GT the regions are still boxes.
                    "geometry": pred_geometry,
                    "iou": pred.get("_matched_iou"),
                    "matchedAnnotationId": pred.get("_matched_annotation_id"),
                }
                if is_detection:
                    region["x"] = pred["x"] / img_w * 100.0
                    region["y"] = pred["y"] / img_h * 100.0
                    region["width"] = pred["width"] / img_w * 100.0
                    region["height"] = pred["height"] / img_h * 100.0
                else:
                    region["value"] = [
                        [pt[0] / img_w * 100.0, pt[1] / img_h * 100.0]
                        for pt in pred["value"]
                    ]
                task_regions.append(region)

            mean_conf, mean_iou, precision, recall, tp, fp, fn = _task_metrics(
                per_class_results, len(effective_gt)
            )

            # Accumulate per-class stats.
            for ci, score, matched_iou in per_class_results:
                if 0 <= ci < n_classes:
                    class_confidence[ci].append(score)
                    if matched_iou is not None:
                        class_iou[ci].append(matched_iou)

            if annotated:
                # Accumulate dataset-level P/R counts (failed and unannotated
                # tasks contribute nothing).
                dataset_tp += tp
                dataset_fp += fp
                dataset_fn += fn
            else:
                # Unannotated task: GT is unknown (not empty), so evaluation
                # metrics are meaningless — keep only the detection confidence.
                mean_iou, precision, recall = None, None, None

        except Exception:
            _log.exception("error processing task %d — treating as null", task_id)
            mean_conf, mean_iou, precision, recall = None, None, None, None

        chunk_results.append({
            "taskId": task_id,
            "meanConfidence": mean_conf,
            "meanIou": mean_iou,
            "precision": precision,
            "recall": recall,
            "regions": task_regions,
        })
        processed += 1

        if len(chunk_results) >= chunk_size or processed == total:
            _log.info("progress %d/%d — sending chunk of %d", processed, total, len(chunk_results))
            try:
                _post_json(
                    f"{webhook_url}/progress/{report_id}",
                    {
                        "processed": processed,
                        "total": total,
                        "taskResults": chunk_results,
                    },
                )
            except Exception:
                _log.exception("progress webhook failed (continuing)")
            chunk_results = []

    # By this point every prefetch thread has hit its stop sentinel (we
    # consumed exactly `total` results above) — join is just cleanup.
    for t in prefetch_threads:
        t.join()

    # Build per-class box-stats.
    per_class_stats = []
    for ci in range(n_classes):
        confs = class_confidence[ci]
        ious = class_iou[ci]
        if not confs:
            continue  # class never detected — skip
        per_class_stats.append({
            "labelId": label_ids[ci],
            "name": label_names[ci],
            "color": label_colors[ci],
            "confidence": _box_stats(confs),
            "iou": _box_stats(ious),
            "detectionCount": len(confs),
            "tpCount": len(ious),
        })

    # Compute dataset-level overall precision & recall (micro over all tasks).
    overall_precision: Optional[float] = (
        dataset_tp / (dataset_tp + dataset_fp) if (dataset_tp + dataset_fp) > 0 else None
    )
    overall_recall: Optional[float] = (
        dataset_tp / (dataset_tp + dataset_fn) if (dataset_tp + dataset_fn) > 0 else None
    )

    _log.info(
        "sending complete webhook with %d class stats (overall precision=%.3f recall=%.3f)",
        len(per_class_stats),
        overall_precision if overall_precision is not None else float("nan"),
        overall_recall if overall_recall is not None else float("nan"),
    )
    _post_json(
        f"{webhook_url}/complete/{report_id}",
        {
            "perClassStats": per_class_stats,
            "overallPrecision": overall_precision,
            "overallRecall": overall_recall,
        },
    )
    _log.info("confidence report batch job done")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        _log.exception("fatal error in confidence report batch job")
        # Best-effort error webhook — $WEBHOOK_URL and $REPORT_ID not always
        # available at this point, so we read from env as a fallback.
        webhook_url = os.environ.get("WEBHOOK_URL", "")
        report_id = os.environ.get("REPORT_ID", "0")
        if webhook_url and report_id != "0":
            try:
                _post_json(
                    f"{webhook_url.rstrip('/')}/error/{report_id}",
                    {"errorMessage": f"{type(exc).__name__}: {exc}"},
                )
            except Exception:
                pass
        sys.exit(1)
