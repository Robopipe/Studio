"""Map a Robopipe ModelConfig to Ultralytics YOLO training kwargs.

Ultralytics owns its augmentation pipeline (defaults are strong), so the
structured `dataset_config.augmentations` list from the API is intentionally
ignored here. All tuning flows through `training_config.custom_hyperparams`,
which is merged verbatim into `YOLO.train(**kwargs)`.

Recognized keys in custom_hyperparams (see https://docs.ultralytics.com/usage/cfg/):
    lr0, lrf, momentum, weight_decay, warmup_epochs, close_mosaic, box, cls,
    dfl, hsv_h, hsv_s, hsv_v, degrees, translate, scale, shear, perspective,
    flipud, fliplr, mosaic, mixup, copy_paste, optimizer, cos_lr, patience,
    imgsz, workers, device, amp
Plus two ml-yolo-specific keys stripped before passthrough:
    backend          — consumed by the API dispatcher
    model_variant    — pretrained weights filename (e.g. yolo11m.pt)
"""

from pathlib import Path
from typing import Any

import yaml

from ..models.model_config import ModelConfig
from ..models.model_type import ModelType
from .dataset import DATASET_DIR


# Default pretrained weights per task. Nano variant on purpose — small enough
# to download quickly and train on CPU for local Docker smoke-tests on the M4.
# Override via custom_hyperparams.model_variant for GPU runs.
_DEFAULT_VARIANT: dict[ModelType, str] = {
    ModelType.DETECTION: "yolo11n.pt",
    ModelType.CLASSIFICATION: "yolo11n-cls.pt",
    ModelType.SEGMENTATION: "yolo11n-seg.pt",
}


def get_model_variant(config: ModelConfig) -> str:
    custom = config.training_config.custom_hyperparams or {}
    variant = custom.get("model_variant")
    if variant:
        return variant if str(variant).endswith(".pt") else f"{variant}.pt"
    return _DEFAULT_VARIANT[config.type]


def build_data_yaml(config: ModelConfig, workdir: str) -> str:
    """Write an Ultralytics data.yaml pointing at the prepared dataset.

    Dataset layout produced by `ml/dataset.py`:
        workdir/dataset/
            images/{train,val,test}/*.jpg        (detection / segmentation)
            labels/{train,val,test}/*.txt
            {train,valid,test}/<cls>/*.jpg       (classification)
    Returns the absolute path to data.yaml (or the classification root, which
    Ultralytics accepts directly for `data=` on classification tasks).
    """
    ds = config.training_config.dataset_config
    dataset_root = Path(workdir) / DATASET_DIR
    names = {i: str(i) for i in range(len(ds.labels))}

    if config.type == ModelType.CLASSIFICATION:
        # luxonis dataset prep uses `valid/`; Ultralytics looks for `val/`.
        # Symlink to keep both shared tooling and Ultralytics happy.
        valid_dir = dataset_root / "valid"
        val_dir = dataset_root / "val"
        if valid_dir.exists() and not val_dir.exists():
            val_dir.symlink_to(valid_dir, target_is_directory=True)
        return str(dataset_root)

    data_yaml = dataset_root / "data.yaml"
    body: dict[str, Any] = {
        "path": str(dataset_root),
        "train": "images/train",
        "val": "images/val",
        "test": "images/test",
        "nc": len(ds.labels),
        "names": names,
    }
    with data_yaml.open("w") as f:
        yaml.dump(body, f)
    return str(data_yaml)


def build_train_kwargs(
    config: ModelConfig, data_path: str, project_dir: str
) -> dict[str, Any]:
    """Build the kwargs dict passed to YOLO.train(...)."""
    tc = config.training_config
    custom = dict(tc.custom_hyperparams or {})
    custom.pop("backend", None)
    custom.pop("model_variant", None)

    kwargs: dict[str, Any] = {
        "data": data_path,
        "epochs": tc.epochs,
        "batch": tc.batch_size,
        "project": project_dir,
        "name": str(config.id),
        "exist_ok": True,
        "verbose": True,
        "cache": True,  # Cache images in RAM for much faster epoch times
    }
    # custom_hyperparams wins over defaults but not over the dispatch kwargs above.
    for key, value in custom.items():
        kwargs[key] = value
    return kwargs
