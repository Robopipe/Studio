"""FastAPI server for on-demand pre-annotation.

POST /predict/segmentation — segmentation models, returns polygon contours
POST /predict/detection    — detection models, returns bounding rectangles

The caller is apps/api, which has already authorized the user, signed
short-lived GCS URLs for both the image and the model archive, and
mapped the project's labels to model class indices on the way back. We
just run inference and return results in original-image pixel space.

Cold path (~10-20 s): download model + InferenceSession construction.
Warm path (~1-3 s on CPU at 1280x1280): cache hit, just inference.
"""

import logging
import os

import cv2  # noqa: F401  — eager import: forces libGL + libstdc++ load at boot
import numpy as np  # noqa: F401  — eager import: warm BLAS dispatcher
import onnxruntime as ort

from fastapi import Depends, FastAPI, HTTPException, status
from pydantic import BaseModel, Field, HttpUrl

from .auth import require_api_key
from .cache import ModelCache
from .image_io import fetch_image
from .output_format import normalize_det_outputs, normalize_outputs
from .postprocess import decode_yolo_det, decode_yolo_seg
from .preprocess import preprocess

logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"))
_log = logging.getLogger("ml-infer")

# Touch onnxruntime's provider list at import time. The first call
# inside an InferenceSession constructor lazy-loads the EP plugin; doing
# it here moves that ~200-400 ms cost from the first /predict to
# container boot, where the startup probe absorbs it.
_log.info("ort providers: %s", ort.get_available_providers())

_CACHE = ModelCache(capacity=int(os.environ.get("MODEL_CACHE_SIZE", "4")))

app = FastAPI(title="ml-infer", version="0.1.0")


class SegPredictRequest(BaseModel):
    imageUrl: HttpUrl
    modelUrl: HttpUrl
    modelId: int = Field(gt=0)
    conf: float = Field(default=0.25, ge=0.0, le=1.0)
    iou: float = Field(default=0.45, ge=0.0, le=1.0)
    polyEpsilon: float = Field(default=0.005, ge=0.0, le=0.05)
    maskThreshold: float = Field(default=0.5, ge=0.0, le=1.0)
    minAreaPx: float = Field(default=4.0, ge=0.0, le=10000.0)
    fillConcavityClasses: list[int] = Field(default_factory=list)
    maxDet: int = Field(default=300, gt=0, le=10000)


class PredictedPolygon(BaseModel):
    classIndex: int
    score: float
    value: list[tuple[float, float]]


class SegPredictResponse(BaseModel):
    polygons: list[PredictedPolygon]


class DetPredictRequest(BaseModel):
    imageUrl: HttpUrl
    modelUrl: HttpUrl
    modelId: int = Field(gt=0)
    conf: float = Field(default=0.25, ge=0.0, le=1.0)
    iou: float = Field(default=0.45, ge=0.0, le=1.0)
    minAreaPx: float = Field(default=4.0, ge=0.0, le=10000.0)
    maxDet: int = Field(default=300, gt=0, le=10000)


class PredictedRectangle(BaseModel):
    classIndex: int
    score: float
    x: float
    y: float
    width: float
    height: float


class DetPredictResponse(BaseModel):
    rectangles: list[PredictedRectangle]


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "cachedModels": list(_CACHE._entries.keys())}


def _load_and_fetch(model_id: int, model_url: str, image_url: str):
    try:
        loaded = _CACHE.get(model_id, model_url)
    except Exception as e:
        _log.exception("model load failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"model load failed: {e}",
        ) from e
    try:
        img = fetch_image(image_url)
    except Exception as e:
        _log.exception("image fetch failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"image fetch failed: {e}",
        ) from e
    return loaded, img


@app.post(
    "/predict/segmentation",
    response_model=SegPredictResponse,
    dependencies=[Depends(require_api_key)],
)
def predict_segmentation(req: SegPredictRequest) -> SegPredictResponse:
    loaded, img = _load_and_fetch(req.modelId, str(req.modelUrl), str(req.imageUrl))

    h, w = img.shape[:2]
    session = loaded.session
    inputs = session.get_inputs()
    in_name = inputs[0].name
    in_shape = inputs[0].shape
    in_h = in_shape[2] if isinstance(in_shape[2], int) else 640
    in_w = in_shape[3] if isinstance(in_shape[3], int) else 640

    tensor, meta = preprocess(img, (in_h, in_w))
    outputs = session.run(None, {in_name: tensor})
    output_names = [o.name for o in session.get_outputs()]

    try:
        output0, output1 = normalize_outputs(outputs, output_names, (in_h, in_w))
    except (ValueError, StopIteration) as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"unsupported output structure: {e}",
        ) from e

    polys = decode_yolo_seg(
        output0,
        output1,
        n_classes=len(loaded.class_names),
        img_shape=(h, w),
        input_shape=(in_h, in_w),
        letterbox_meta=meta,
        conf_threshold=req.conf,
        iou_threshold=req.iou,
        max_det=req.maxDet,
        mask_threshold=req.maskThreshold,
        poly_epsilon=req.polyEpsilon,
        min_area_px=req.minAreaPx,
        fill_concavity_classes=set(req.fillConcavityClasses),
    )

    return SegPredictResponse(
        polygons=[
            PredictedPolygon(
                classIndex=p["classIndex"], score=p["score"], value=p["value"]
            )
            for p in polys
        ]
    )


@app.post(
    "/predict/detection",
    response_model=DetPredictResponse,
    dependencies=[Depends(require_api_key)],
)
def predict_detection(req: DetPredictRequest) -> DetPredictResponse:
    loaded, img = _load_and_fetch(req.modelId, str(req.modelUrl), str(req.imageUrl))

    h, w = img.shape[:2]
    session = loaded.session
    inputs = session.get_inputs()
    in_name = inputs[0].name
    in_shape = inputs[0].shape
    in_h = in_shape[2] if isinstance(in_shape[2], int) else 640
    in_w = in_shape[3] if isinstance(in_shape[3], int) else 640

    tensor, meta = preprocess(img, (in_h, in_w))
    outputs = session.run(None, {in_name: tensor})
    output_names = [o.name for o in session.get_outputs()]

    try:
        output0 = normalize_det_outputs(outputs, output_names, (in_h, in_w))
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"unsupported output structure: {e}",
        ) from e

    boxes = decode_yolo_det(
        output0,
        n_classes=len(loaded.class_names),
        img_shape=(h, w),
        input_shape=(in_h, in_w),
        letterbox_meta=meta,
        conf_threshold=req.conf,
        iou_threshold=req.iou,
        max_det=req.maxDet,
        min_area_px=req.minAreaPx,
    )

    return DetPredictResponse(
        rectangles=[
            PredictedRectangle(
                classIndex=b["classIndex"],
                score=b["score"],
                x=b["x"],
                y=b["y"],
                width=b["width"],
                height=b["height"],
            )
            for b in boxes
        ]
    )
