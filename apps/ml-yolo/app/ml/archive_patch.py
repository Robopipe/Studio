"""Inject YOLO head metadata into NN archives produced by HubAI for
Ultralytics-trained models.

HubAI's RVC4 converter, fed a plain Ultralytics ONNX, produces an NN
archive with model + I/O metadata but no `heads` block. The camera side's
`depthai_nodes.ParsingNeuralNetwork` walks `heads` to wire parsers and
crashes with "No heads defined in the NN Archive." when the list is empty.
luxonis-train exports populated heads for us; ultralytics exports do not.

We patch the archive client-side: read config.json, append a YOLO head,
re-pack. Only DETECTION is wired up today — classification/segmentation
log a warning so we don't ship metadata we haven't verified end-to-end.
"""

import json
import os
import tarfile
import tempfile
from pathlib import Path

from luxonis_ml.nn_archive import is_nn_archive
from luxonis_ml.nn_archive.config import Config as NNArchiveConfig

from ..models.model_type import ModelType


def _yolo_subtype(model_variant: str) -> str:
    stem = Path(model_variant).stem.lower()
    if stem.startswith("yolo26"):
        return "yolo26"
    return "yolov8"


# Pre-NMS thresholds the on-device DetectionParser uses. The dashboard
# does its own confidence filtering on top
# (sensor.dashboard_config.confidenceThreshold), so this is a coarse
# pre-filter, not the user-facing knob. Defaults match Ultralytics.
_DEFAULT_IOU_THRESHOLD = 0.45
_DEFAULT_CONF_THRESHOLD = 0.25
_DEFAULT_MAX_DET = 300

# Override we stamp onto HubAI-populated heads. HubAI bakes 0.25 in, which
# silently drops detections before the dashboard's runtime confidence
# slider can see them; pushing this near zero hands authority back to the
# dashboard. We can't omit the field — luxonis-ml's schema requires it.
_OVERRIDE_CONF_THRESHOLD = 0.01


def patch_nn_archive_heads(
    archive_path: str | Path,
    model_type: ModelType,
    label_ids: list[int],
    model_variant: str = "",
) -> None:
    """Mutate the NN archive at `archive_path` in-place to ensure it has a
    valid `heads` block. No-op when the file isn't an NN archive, when
    heads are already populated, or when the model type isn't one we've
    wired up."""
    p = Path(archive_path)

    if not is_nn_archive(p):
        # RVC2 superblob, raw blob, etc. The camera loads these via
        # `dai.OpenVINO.Blob`, not `dai.NNArchive`, so heads don't apply.
        return

    if model_type != ModelType.DETECTION:
        print(
            f"[ml-yolo] heads-patch: skipping {model_type.value} archive "
            f"{p.name} — only DETECTION is wired up. The camera-side "
            "parser will likely fail when this model is deployed."
        )
        return

    compression = _detect_compression(p)
    if compression is None:
        print(
            f"[ml-yolo] heads-patch: unknown compression for {p.name}, skipping"
        )
        return

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        extract_dir = tmp_path / "extracted"
        extract_dir.mkdir()
        _safe_extract(p, extract_dir)

        config_path = extract_dir / "config.json"
        if not config_path.exists():
            # is_nn_archive() should have caught this, but be defensive.
            print(f"[ml-yolo] heads-patch: no config.json in {p.name}, skipping")
            return

        config = json.loads(config_path.read_text())
        model = config.setdefault("model", {})

        if model.get("heads"):
            n_heads = len(model["heads"])
            for head in model["heads"]:
                head.setdefault("metadata", {})["conf_threshold"] = (
                    _OVERRIDE_CONF_THRESHOLD
                )
            summary = (
                f"overrode conf_threshold to {_OVERRIDE_CONF_THRESHOLD} "
                f"in {n_heads} existing head(s)"
            )
        else:
            outputs = model.get("outputs") or []
            if not outputs:
                print(
                    f"[ml-yolo] heads-patch: no model.outputs in {p.name}, skipping"
                )
                return
            output_names = [o["name"] for o in outputs]

            # Ultralytics v8/v11 detection ONNX produces a single concatenated
            # output (typically `output0`, shape (1, 4+nc, num_anchors)) which
            # HubAI preserves through RVC4 conversion. Passing every model
            # output to the YOLO parser matches what `outputs=null` would have
            # done, and stays correct if HubAI ever splits the tensor.
            head = {
                "parser": "YOLO",
                "metadata": {
                    "classes": [str(lid) for lid in label_ids],
                    "n_classes": len(label_ids),
                    "iou_threshold": _DEFAULT_IOU_THRESHOLD,
                    "conf_threshold": _DEFAULT_CONF_THRESHOLD,
                    "max_det": _DEFAULT_MAX_DET,
                    "anchors": None,
                    "subtype": _yolo_subtype(model_variant),
                    "yolo_outputs": output_names,
                },
                "outputs": output_names,
            }
            model["heads"] = [head]
            summary = (
                f"injected YOLO head (n_classes={len(label_ids)}, "
                f"yolo_outputs={output_names})"
            )

        # Schema sanity check. If the patched config doesn't validate,
        # raise — better to fail the training job here than to ship a
        # broken archive that 500s on every dashboard upload.
        NNArchiveConfig(**config)

        config_path.write_text(json.dumps(config, indent=2))

        # Write the repacked archive next to the original so the final
        # rename stays on one filesystem and `os.replace` is atomic — a
        # crash mid-write here leaves the original intact instead of
        # half-overwriting it.
        repacked = p.with_suffix(p.suffix + ".patched")
        _repack(extract_dir, repacked, compression)
        os.replace(repacked, p)

    print(f"[ml-yolo] heads-patch: {summary} in {p.name}")


def _detect_compression(p: Path) -> str | None:
    name = p.name.lower()
    if name.endswith(".tar.xz"):
        return "xz"
    if name.endswith(".tar.gz") or name.endswith(".tgz"):
        return "gz"
    if name.endswith(".tar.bz2") or name.endswith(".tbz2"):
        return "bz2"
    if name.endswith(".tar"):
        return ""
    return None


def _safe_extract(archive: Path, dest: Path) -> None:
    with tarfile.open(archive, mode="r:*") as tf:
        for member in tf.getmembers():
            if member.name.startswith("/") or ".." in member.name:
                continue
            tf.extract(member, path=dest)


def _repack(src_dir: Path, dest_archive: Path, compression: str) -> None:
    mode = f"w:{compression}" if compression else "w"
    with tarfile.open(dest_archive, mode=mode) as tf:
        for entry in sorted(src_dir.rglob("*")):
            if entry.is_file():
                tf.add(entry, arcname=entry.relative_to(src_dir).as_posix())
