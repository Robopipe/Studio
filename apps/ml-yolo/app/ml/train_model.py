"""Ultralytics-backed training orchestrator.

Keeps the same public surface as apps/ml/app/ml/train_model.py so the rest
of the service (api/train.py, job.py, config) stays identical.
"""

from multiprocessing import Process
import os
import tempfile
from pathlib import Path
from typing import Optional

import requests
from ultralytics import YOLO

from ..config import get_config
from ..models.model_config import ModelConfig
from ..models.model_type import ModelOutputType
from ..models.training_config import OutputUpload
from .dataset import prepare_dataset
from .model_conversion import convert_model
from .preprocess import preprocess_dataset
from .ultralytics_callbacks import WebhookCallbacks
from .ultralytics_config import (
    build_data_yaml,
    build_train_kwargs,
    get_model_variant,
)


def _upload_to_signed_url(upload: OutputUpload, file_path: str) -> None:
    try:
        with open(file_path, "rb") as f:
            response = requests.put(
                upload.url,
                data=f,
                headers={"Content-Type": "application/octet-stream"},
            )
            response.raise_for_status()
            print(f"[ml-yolo] Uploaded {upload.type.value} to {upload.object_path}")
    except Exception as e:
        print(f"[ml-yolo] Failed to upload {upload.type.value}: {e}")
        raise


def _post_progress(webhook_url: str, api_key: str, model_id: int, payload: dict) -> None:
    try:
        r = requests.post(
            f"{webhook_url}/progress/{model_id}",
            json=payload,
            headers={"Authorization": api_key},
        )
        r.raise_for_status()
    except requests.RequestException as e:
        print(f"[ml-yolo] Failed to send progress webhook: {e}")


def _post_complete(webhook_url: str, api_key: str, model_id: int, payload: dict) -> None:
    try:
        r = requests.post(
            f"{webhook_url}/complete/{model_id}",
            json=payload,
            headers={"Authorization": api_key},
        )
        r.raise_for_status()
        print(f"[ml-yolo] Posted training-complete for model {model_id}")
    except requests.RequestException as e:
        print(f"[ml-yolo] Failed to post training-complete: {e}")


def _resolve_imgsz(config: ModelConfig) -> tuple[int, int]:
    """Pull imgsz out of custom_hyperparams for the preprocess step. Ultralytics
    itself reads this same key at train time."""
    custom = config.training_config.custom_hyperparams or {}
    raw = custom.get("imgsz")
    if isinstance(raw, int):
        return (raw, raw)
    if isinstance(raw, (list, tuple)) and len(raw) == 2:
        return (int(raw[0]), int(raw[1]))
    return (640, 640)


def run_training(config: ModelConfig) -> None:
    cfg = get_config()
    webhook_url = cfg.webhook_url
    api_key = cfg.api_key
    callbacks: Optional[WebhookCallbacks] = None

    try:
        with tempfile.TemporaryDirectory() as workdir:
            # 1) Prepare YOLO-format dataset on disk (shared with luxonis pipeline).
            prepare_dataset(
                workdir,
                config.data,
                config.training_config.dataset_config,
                config.type,
            )

            # 2) Optional deterministic preprocessings.
            if config.training_config.dataset_config.preprocessings:
                preprocess_dataset(
                    workdir,
                    config.training_config.dataset_config.preprocessings,
                    config.type,
                    _resolve_imgsz(config),
                )

            # 3) Write Ultralytics data.yaml (or resolve classification root).
            data_path = build_data_yaml(config, workdir)

            # 4) Load pretrained weights + wire callbacks.
            variant = get_model_variant(config)
            print(f"[ml-yolo] Loading Ultralytics model: {variant}")
            model = YOLO(variant)

            if webhook_url is not None:
                callbacks = WebhookCallbacks(
                    webhook_url=f"{webhook_url}/progress/{config.id}",
                    api_key=api_key,
                    model_id=config.id,
                    model_type=config.type,
                    label_ids=config.training_config.dataset_config.label_ids,
                )
                model.add_callback("on_fit_epoch_end", callbacks.on_fit_epoch_end)

            # 5) Train.
            project_dir = os.path.join(workdir, "runs")
            train_kwargs = build_train_kwargs(config, data_path, project_dir)
            print(f"[ml-yolo] train kwargs: {train_kwargs}")
            model.train(**train_kwargs)

            # 6) Export best weights → ONNX (decode in-graph, compatible with HubAI RVC4).
            save_dir = Path(model.trainer.save_dir)
            best_pt = save_dir / "weights" / "best.pt"
            print(f"[ml-yolo] Exporting ONNX from {best_pt}")
            best = YOLO(str(best_pt))
            onnx_path = str(best.export(format="onnx", simplify=True, opset=12, dynamic=False))
            print(f"[ml-yolo] ONNX written to {onnx_path}")

            if webhook_url is None:
                print("[ml-yolo] No webhook_url configured, skipping uploads")
                return

            # 7) Upload RAW + run HubAI conversions for each requested output.
            output_types = config.training_config.output_types
            uploads_by_type: dict[ModelOutputType, OutputUpload] = {
                u.type: u for u in config.output_config
            }

            def upload_for(t: ModelOutputType) -> OutputUpload:
                upload = uploads_by_type.get(t)
                if upload is None:
                    raise RuntimeError(f"No signed upload URL for output type {t.value}")
                return upload

            completed: list[OutputUpload] = []
            if ModelOutputType.RAW in output_types:
                raw_upload = upload_for(ModelOutputType.RAW)
                _upload_to_signed_url(raw_upload, onnx_path)
                completed.append(raw_upload)

            non_raw = [t for t in output_types if t != ModelOutputType.RAW]
            if non_raw:
                _post_progress(
                    webhook_url, api_key, config.id, {"progress": {"type": "converting"}}
                )

            for output_type in non_raw:
                print(f"[ml-yolo] Converting to {output_type.value}")
                res = convert_model(
                    path=onnx_path,
                    output_dir=os.path.join(workdir, "converted", output_type.value),
                    target_format=output_type,
                )
                conv_upload = upload_for(output_type)
                _upload_to_signed_url(conv_upload, res.downloaded_path)
                completed.append(conv_upload)

            _post_complete(
                webhook_url,
                api_key,
                config.id,
                {
                    "outputs": [
                        {"type": u.type.value, "objectPath": u.object_path}
                        for u in completed
                    ],
                    "finalAccuracy": callbacks.final_metrics.get("accuracy") if callbacks else None,
                    "finalLoss": callbacks.final_metrics.get("loss") if callbacks else None,
                },
            )
    except Exception as e:
        error_message = str(e)
        print(f"[ml-yolo] Training error: {error_message}")
        if webhook_url is not None:
            _post_progress(
                webhook_url,
                api_key,
                config.id,
                {"progress": {"type": "error", "errorMessage": error_message}},
            )


def train_model(config: ModelConfig):
    process = Process(target=run_training, args=(config,))
    process.start()
    return {"status": "Training started"}
