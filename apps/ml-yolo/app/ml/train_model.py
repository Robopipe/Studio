"""Ultralytics-backed training orchestrator.

Keeps the same public surface as apps/ml/app/ml/train_model.py so the rest
of the service (api/train.py, job.py, config) stays identical.
"""

from multiprocessing import Process
import os
import subprocess
import tempfile
from pathlib import Path
from typing import Optional

import requests
from ultralytics import YOLO

from ..config import get_config
from ..models.model_config import ModelConfig
from ..models.model_type import ModelOutputType
from ..models.training_config import OutputUpload
from ..models.model_type import ModelType
from .archive_patch import patch_nn_archive_heads
from .dataset import (
    DATASET_DIR,
    IMAGE_DIR,
    TEST_DIR,
    TRAIN_DIR,
    VAL_DIR,
    prepare_dataset,
)
from .model_conversion import convert_model
from .modelconverter_conversion import (
    convert_rvc4_int8,
    sample_calibration_images,
)
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


def _post_progress(
    webhook_url: str, api_key: str, model_id: int, payload: dict
) -> None:
    try:
        r = requests.post(
            f"{webhook_url}/progress/{model_id}",
            json=payload,
            headers={"Authorization": api_key},
        )
        r.raise_for_status()
    except requests.RequestException as e:
        print(f"[ml-yolo] Failed to send progress webhook: {e}")


def _post_complete(
    webhook_url: str, api_key: str, model_id: int, payload: dict
) -> None:
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


def _export_via_tools(
    best_pt: Path,
    imgsz: tuple[int, int],
    workdir: str,
) -> tuple[str, str]:
    """Run luxonis/tools as a subprocess to convert a trained .pt into a
    multi-output ONNX + NN archive whose layer names and `heads` metadata
    match what `depthai_nodes`' parsers expect on the camera.

    Returns (onnx_path, archive_path). Both are absolute paths into
    `workdir`'s tools subtree and live until `workdir` is cleaned up.

    Rationale for invoking via subprocess instead of `from tools import ...`:
      - License isolation. tools is AGPL-3.0; importing into our process
        would arguably link AGPL code into ml-yolo. The CLI invocation
        keeps the boundary clean.
      - Dep isolation. tools pins onnx==1.21.0 and pulls mmcv 1.x, both
        of which conflict with ml-yolo's pinned stack (see the onnx pin
        rationale below in run_training).

    The tool path is taken from `ROBOPIPE_TOOLS_BIN` (set by Dockerfile
    to /opt/tools-venv/bin/tools) so a developer can override it for
    local testing.
    """
    tools_bin = os.environ.get(
        "ROBOPIPE_TOOLS_BIN",
        "/Users/adamberkes/Desktop/Work/KOALA42/robopipe/tools/.venv/bin/tools",
    )
    tools_run_dir = Path(workdir) / "tools_run"
    tools_run_dir.mkdir(parents=True, exist_ok=True)

    cmd = [
        tools_bin,
        str(best_pt),
        # `--no-use-rvc2` is the right setting for RVC3/RVC4 targets
        # (the user's OAK4 hardware). Despite the flag's name, it
        # selects a graph variant — RVC2 needs an extra `conf = max(cls)`
        # reduction baked in; RVC3/RVC4 don't. HubAI's RVC4 compiler
        # consumes the `--no-use-rvc2` ONNX cleanly.
        "--no-use-rvc2",
        "--imgsz",
        f"{imgsz[0]} {imgsz[1]}",
    ]
    print(f"[ml-yolo] luxonis/tools cmd: {' '.join(cmd)} (cwd={tools_run_dir})")

    result = subprocess.run(
        cmd,
        cwd=str(tools_run_dir),
        capture_output=True,
        text=True,
    )
    # Always surface tool output so failures and version mismatches are
    # debuggable from the training job logs. tools logs to stderr via
    # loguru; stdout is mostly the typer help/banner.
    if result.stdout:
        print(f"[ml-yolo] tools stdout:\n{result.stdout}")
    if result.stderr:
        print(f"[ml-yolo] tools stderr:\n{result.stderr}")
    if result.returncode != 0:
        raise RuntimeError(f"luxonis/tools export failed (exit {result.returncode})")

    # tools writes to <cwd>/shared_with_container/outputs/<modelname>_<ts>/.
    # We give it a fresh tools_run_dir per training job, so there should
    # be exactly one timestamped subdir to find.
    outputs_root = tools_run_dir / "shared_with_container" / "outputs"
    if not outputs_root.exists():
        raise RuntimeError(
            f"luxonis/tools produced no outputs directory at {outputs_root}"
        )
    candidates = [p for p in outputs_root.iterdir() if p.is_dir()]
    if not candidates:
        raise RuntimeError(f"luxonis/tools produced no output subdir in {outputs_root}")
    if len(candidates) > 1:
        # Shouldn't happen given fresh tools_run_dir, but be explicit.
        candidates.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    out_dir = candidates[0]

    onnx = out_dir / f"{best_pt.stem}.onnx"
    archive = out_dir / f"{best_pt.stem}.tar.xz"
    if not onnx.exists() or not archive.exists():
        produced = sorted(p.name for p in out_dir.iterdir())
        raise RuntimeError(
            f"luxonis/tools did not produce expected files in {out_dir}. "
            f"Found: {produced}"
        )

    print(f"[ml-yolo] tools produced {onnx.name} and {archive.name} in {out_dir}")
    return str(onnx), str(archive)


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
                model.add_callback("on_train_end", callbacks.on_train_end)

            # 5) Train.
            project_dir = os.path.join(workdir, "runs")
            train_kwargs = build_train_kwargs(config, data_path, project_dir)
            print(f"[ml-yolo] train kwargs: {train_kwargs}")
            model.train(**train_kwargs)

            # 6) Export best weights via luxonis/tools (subprocess, separate
            # venv) → ONNX with multi-output naming the camera-side parsers
            # expect, plus an NN archive with proper `heads` metadata. We
            # feed the *archive* (not raw ONNX) to HubAI below so the heads
            # block survives RVC4 compilation; tools' graph surgery is what
            # makes detection, segmentation, pose, and OBB all work without
            # us reimplementing the head layout per task type.
            #
            # The previous path (`best.export(format="onnx", simplify=False,
            # opset=18, dynamic=False)`) produced a single-output Ultralytics
            # ONNX (`output0`, shape `(1, 4+nc, num_anchors)`), which HubAI
            # would compile but emit an archive without heads — segmentation
            # then crashed on the camera with "No heads defined in the NN
            # Archive." tools-produced archives carry the heads through.
            save_dir = Path(model.trainer.save_dir)
            best_pt = save_dir / "weights" / "best.pt"
            print(f"[ml-yolo] Exporting via luxonis/tools from {best_pt}")
            onnx_path, archive_path = _export_via_tools(
                best_pt, _resolve_imgsz(config), workdir
            )

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
                    raise RuntimeError(
                        f"No signed upload URL for output type {t.value}"
                    )
                return upload

            completed: list[OutputUpload] = []
            if ModelOutputType.RAW in output_types:
                raw_upload = upload_for(ModelOutputType.RAW)
                _upload_to_signed_url(raw_upload, onnx_path)
                completed.append(raw_upload)

            non_raw = [t for t in output_types if t != ModelOutputType.RAW]
            if non_raw:
                _post_progress(
                    webhook_url,
                    api_key,
                    config.id,
                    {"progress": {"type": "converting"}},
                )

            # Routing: RVC4+INT8 goes through the offline luxonis/modelconverter
            # path so we can feed it a real calibration set sampled from the
            # training images. Everything else (FP16, RVC2/RVC3 of any
            # precision) goes through HubAI — modelconverter could do RVC2/RVC3
            # too but HubAI is fine for those and we'd just be re-implementing
            # the OpenVINO chain locally for no win.
            is_int8 = config.training_config.quantization == "INT8"

            if is_int8:
                quantization_mode = "INT8_INT16_MIXED"
            else:
                quantization_mode = "FP16_STANDARD"
            # HubAI fallback domain — used for RVC2/RVC3 INT8 only (where
            # modelconverter isn't on the path). RVC4+INT8 supplies its own
            # local calibration dir, so this value is ignored there.
            hubai_quantization_data = "GENERAL" if is_int8 else None

            # Sample a calibration set up-front when we know we'll need it,
            # so the cost is paid once even if multiple targets request it.
            #
            # Priority: test → val → train. The test split is held out from
            # training, so it's the closest proxy to inference distribution
            # and gives the quantizer the best signal for activation ranges.
            # We fall back to val and then train only if test alone doesn't
            # reach max_images (small datasets, or skewed splits).
            calib_dir: str | None = None
            if is_int8 and ModelOutputType.RVC4 in non_raw:
                calib_dir = os.path.join(workdir, "calib_images")
                # Layouts differ by task type — see prepare_dataset:
                #   classification:         <workdir>/dataset/<split>/<label>/*.jpg
                #   detection/segmentation: <workdir>/dataset/images/<split>/*.jpg
                # Classification also renames the val split to "valid"
                # (dataset.py mutates VAL_DIR globally). Mirror preprocess.py's
                # resolution rather than reading the mutated global, which
                # would be stale here had we imported it before the mutation.
                if config.type == ModelType.CLASSIFICATION:
                    base = os.path.join(workdir, DATASET_DIR)
                    val_subdir = "valid"
                else:
                    base = os.path.join(workdir, DATASET_DIR, IMAGE_DIR)
                    val_subdir = VAL_DIR
                calib_sources = [
                    os.path.join(base, TEST_DIR),
                    os.path.join(base, val_subdir),
                    os.path.join(base, TRAIN_DIR),
                ]
                n = sample_calibration_images(calib_sources, calib_dir)
                print(
                    f"[ml-yolo] Sampled {n} calibration images "
                    f"(prefer test → val → train) into {calib_dir}"
                )
                if n == 0:
                    raise RuntimeError(
                        "INT8 RVC4 conversion requires at least one calibration "
                        f"image; found none under any of {calib_sources}"
                    )

            for output_type in non_raw:
                use_modelconverter = output_type == ModelOutputType.RVC4 and is_int8

                if use_modelconverter:
                    print(
                        f"[ml-yolo] Converting to {output_type.value} via "
                        f"modelconverter (quantization_mode={quantization_mode}, "
                        f"calibration_dir={calib_dir})"
                    )
                    converted_path = convert_rvc4_int8(
                        archive_path=archive_path,
                        output_dir=os.path.join(
                            workdir, "converted", output_type.value
                        ),
                        calibration_dir=calib_dir,  # type: ignore[arg-type]
                        quantization_mode=quantization_mode,
                    )
                else:
                    print(
                        f"[ml-yolo] Converting to {output_type.value} via HubAI "
                        f"(quantization_mode={quantization_mode}, "
                        f"quantization_data={hubai_quantization_data})"
                    )
                    # Feed HubAI the tools-produced NN archive (not raw ONNX)
                    # so the `heads` block tools generated rides through the
                    # platform-specific compile. HubAI's `is_nn_archive(path)`
                    # check picks the archive path automatically.
                    res = convert_model(
                        path=archive_path,
                        output_dir=os.path.join(
                            workdir, "converted", output_type.value
                        ),
                        target_format=output_type,
                        quantization_mode=quantization_mode,
                        quantization_data=hubai_quantization_data,
                    )
                    converted_path = res.downloaded_path

                # Safety net for the case where the converter strips heads
                # through compilation. For tools-produced archives where heads
                # survive, this is a no-op (idempotent on populated heads).
                # Currently only fixes single-output Ultralytics-style
                # detection archives.
                patch_nn_archive_heads(
                    converted_path,
                    config.type,
                    config.training_config.dataset_config.label_ids,
                    model_variant=get_model_variant(config),
                )
                conv_upload = upload_for(output_type)
                _upload_to_signed_url(conv_upload, converted_path)
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
                    "finalAccuracy": (
                        callbacks.final_metrics.get("accuracy") if callbacks else None
                    ),
                    "finalLoss": (
                        callbacks.final_metrics.get("loss") if callbacks else None
                    ),
                    "bestMap50": (
                        callbacks.final_metrics.get("best_map50") if callbacks else None
                    ),
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
