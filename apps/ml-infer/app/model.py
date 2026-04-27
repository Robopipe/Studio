import json
import tarfile
import tempfile
from dataclasses import dataclass
from pathlib import Path

import onnxruntime as ort


@dataclass
class LoadedModel:
    session: ort.InferenceSession
    class_names: list[str]
    source: Path


def load_model(path: Path, classes_override: list[str] | None = None) -> LoadedModel:
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(p)

    # Sniff content rather than trust the extension — exports from the
    # ml-yolo pipeline can land with a `.tar.xz` name even when they're a
    # raw ONNX protobuf.
    if _looks_like_tar(p):
        try:
            onnx_path, archive_classes = _extract_archive(p)
        except tarfile.ReadError:
            archive_classes = None
            onnx_path = p
        else:
            session = ort.InferenceSession(str(onnx_path), providers=_providers())
            class_names = (
                classes_override
                or archive_classes
                or _numeric_classes(_infer_n_classes(session))
            )
            return LoadedModel(session=session, class_names=class_names, source=p)

    session = ort.InferenceSession(str(p), providers=_providers())
    class_names = classes_override or _numeric_classes(_infer_n_classes(session))
    return LoadedModel(session=session, class_names=class_names, source=p)


def _providers() -> list[str]:
    available = ort.get_available_providers()
    # CoreML first on Apple Silicon, CPU fallback everywhere else.
    preferred = ["CoreMLExecutionProvider", "CPUExecutionProvider"]
    return [p for p in preferred if p in available] or ["CPUExecutionProvider"]


def _looks_like_tar(p: Path) -> bool:
    name = p.name.lower()
    if name.endswith(".onnx"):
        return False
    return name.endswith((".tar.xz", ".tar.gz", ".tgz", ".tar.bz2", ".tbz2", ".tar"))


def _extract_archive(archive: Path) -> tuple[Path, list[str] | None]:
    # Persist the extraction so the InferenceSession can mmap the .onnx
    # file across calls. Caller is expected to be a short-lived CLI; OS
    # cleans /tmp on reboot.
    extract_dir = Path(tempfile.mkdtemp(prefix="ml-infer-"))
    with tarfile.open(archive, "r:*") as tf:
        for member in tf.getmembers():
            if member.name.startswith("/") or ".." in member.name:
                continue
            tf.extract(member, path=extract_dir)

    onnx_files = sorted(extract_dir.rglob("*.onnx"))
    if not onnx_files:
        raise RuntimeError(f"No .onnx file found inside {archive}")
    onnx_path = onnx_files[0]

    class_names: list[str] | None = None
    config_files = sorted(extract_dir.rglob("config.json"))
    if config_files:
        cfg = json.loads(config_files[0].read_text())
        heads = cfg.get("model", {}).get("heads") or []
        if heads:
            meta_classes = (heads[0].get("metadata") or {}).get("classes")
            if meta_classes:
                class_names = [str(c) for c in meta_classes]

    return onnx_path, class_names


def _infer_n_classes(session: ort.InferenceSession) -> int:
    # Two known shapes:
    #   - Standard Ultralytics seg export: one 3D output (1, 4+nc+32, anchors).
    #   - luxonis/tools split export: per-stride 4D heads (1, 4+nc, H, W) named
    #     `*_yolov8`, with mask coeffs broken out into `*_masks`.
    for out in session.get_outputs():
        shape = out.shape
        if (
            len(shape) == 3
            and isinstance(shape[1], int)
            and shape[1] > 36
        ):
            return shape[1] - 4 - 32
    for out in session.get_outputs():
        if "_yolov8" not in out.name:
            continue
        shape = out.shape
        # luxonis/tools split layout: 4 LTRB + 1 injected objectness + nc.
        if len(shape) == 4 and isinstance(shape[1], int) and shape[1] > 5:
            return shape[1] - 5
    return 0


def _numeric_classes(n: int) -> list[str]:
    return [str(i) for i in range(max(n, 0))]
