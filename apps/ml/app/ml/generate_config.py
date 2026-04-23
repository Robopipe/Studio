import sys
import yaml

from ..config import get_config
from ..models.model_config import ModelConfig, ModelType
from .dataset import DATASET_DIR


class _AnchoredInt:
    """Wraps an int with a YAML anchor so yaml.dump emits e.g. `&height 384`."""

    def __init__(self, value: int, anchor: str):
        self.value = value
        self.anchor = anchor


class _FlowList(list):
    """A list subclass that forces YAML flow-style output `[...]`."""


class _AnchorDumper(yaml.Dumper):
    """Custom Dumper that emits pre-set anchors even without aliases."""

    def serialize_node(self, node, parent, index):
        if getattr(node, "anchor", None) is not None and node in self.anchors:
            self.anchors[node] = node.anchor
        super().serialize_node(node, parent, index)


def _anchored_int_representer(dumper: yaml.Dumper, data: _AnchoredInt):
    node = dumper.represent_int(data.value)
    node.anchor = data.anchor
    return node


def _flow_list_representer(dumper: yaml.Dumper, data: _FlowList):
    return dumper.represent_sequence("tag:yaml.org,2002:seq", data, flow_style=True)


_AnchorDumper.add_representer(_AnchoredInt, _anchored_int_representer)
_AnchorDumper.add_representer(_FlowList, _flow_list_representer)


def _get_custom_image_size(custom_hyperparams: dict) -> tuple[int, int] | None:
    """Extract custom image size from user-supplied hyperparams, if present."""
    try:
        size = (
            custom_hyperparams.get("trainer", {})
            .get("preprocessing", {})
            .get("train_image_size")
        )
        if isinstance(size, list) and len(size) == 2:
            return (int(size[0]), int(size[1]))
    except (TypeError, ValueError):
        pass
    return None


def get_image_size(model_config: ModelConfig) -> tuple[int, int]:
    """Return the training image size — custom if provided, otherwise the default."""
    custom = _get_custom_image_size(model_config.training_config.custom_hyperparams)
    if custom is not None:
        return custom
    return (480, 640) if model_config.type != ModelType.CLASSIFICATION else (512, 512)


def get_model_params(model_config: ModelConfig) -> tuple[dict, dict]:
    # Returns (predefined_model_params, model_params) where predefined_model_params
    # is the full `predefined_model:` block (name auto-filled by caller) and
    # `params` within it is forwarded as **kwargs to the predefined model __init__.
    if model_config.type == ModelType.CLASSIFICATION:
        # average=None propagates through TorchMetricWrapper to torchmetrics
        # (F1Score / Accuracy / Recall) so they emit per-class tensors, which
        # luxonis-train splits into `<MetricName>_<classname>` callback_metrics keys.
        return {
            "variant": "light",
            "params": {"metrics_params": {"average": None}},
        }, {}
    elif model_config.type == ModelType.DETECTION:
        # per_class_metrics aliases to `class_metrics=True` on MeanAveragePrecision,
        # which adds `map_per_class` / `mar_100_per_class` to the metric output.
        return {
            "variant": "light",
            "params": {"per_class_metrics": True},
        }, {}
    elif model_config.type == ModelType.SEGMENTATION:
        # per_class_metrics aliases to `per_class=True` on MIoU (JaccardIndex).
        # F1Score has no alias — aggregate-only for now.
        return {
            "variant": "light",
            "params": {"per_class_metrics": True},
        }, {}


def generate_model_config(model_config: ModelConfig) -> dict:
    predefined_model_params, model_params = get_model_params(model_config)
    config = {
        "name": str(model_config.id),
        "predefined_model": {
            "name": model_config.type.to_luxonis_model_type().value,
            **predefined_model_params,
        },
        **model_params,
    }

    return config


def generate_loader_config(model_config: ModelConfig, dir: str) -> dict:
    config = {
        "params": {
            "dataset_name": f"{model_config.id}_dataset",
            "dataset_dir": f"{dir}/{DATASET_DIR}",
        },
    }

    return config


def generate_trainer_config(model_config: ModelConfig) -> dict:
    webhook_url = get_config().webhook_url
    img_size = get_image_size(model_config)
    augmentations_config = [
        aug
        for aug_list in model_config.training_config.dataset_config.augmentations
        for aug in aug_list.to_config(img_size)
    ]
    config = {
        "batch_size": model_config.training_config.batch_size,
        "epochs": model_config.training_config.epochs,
        "n_workers": 8,
        # luxonis-train 0.4.4 only exposes "16-mixed" | "32" (no bf16). Override via custom_hyperparams if a model hits FP16 instability.
        "precision": "16-mixed",
        "matmul_precision": "high",
        "callbacks": [
            {"name": "ExportOnTrainEnd"},
            {"name": "ArchiveOnTrainEnd"},
            {"name": "LearningRateMonitor", "params": {"logging_interval": "epoch"}},
        ],
        "validation_interval": 1,
        "log_sub_losses": False,
        "preprocessing": {
            "train_image_size": _FlowList(
                [
                    _AnchoredInt(img_size[0], "height"),
                    _AnchoredInt(img_size[1], "width"),
                ]
            ),
            "augmentations": augmentations_config,
        },
        "accelerator": "cpu" if sys.platform == "darwin" else "auto",
    }

    if webhook_url is not None:
        config["callbacks"].append(
            {
                "name": "WebhookStats",
                "params": {
                    "url": f"{webhook_url}/progress/{model_config.id}",
                    "id": model_config.id,
                    "model_type": model_config.type.value,
                    "label_ids": list(
                        model_config.training_config.dataset_config.label_ids
                    ),
                },
            }
        )

    return config


def generate_tracker_config(model_config: ModelConfig, dir: str) -> dict:
    config = {
        "is_tensorboard": True,
        "is_wandb": False,
        "is_mlflow": False,
        "save_directory": dir,
    }

    return config


def _deep_merge(base: dict, override: dict) -> dict:
    """Recursively merge override into base. Override values win."""
    result = base.copy()
    for key, value in override.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = _deep_merge(result[key], value)
        else:
            result[key] = value
    return result


# Config paths managed by the ML service or generated from UI controls.
# These must never be overridden by user-supplied custom hyperparameters.
_RESERVED_PATHS: set[str] = {
    # ML service infrastructure
    "model.name",
    "model.predefined_model.name",
    "loader.params.dataset_name",
    "loader.params.dataset_dir",
    "tracker.is_tensorboard",
    "tracker.is_wandb",
    "tracker.is_mlflow",
    "tracker.save_directory",
    "trainer.callbacks",
    "trainer.accelerator",
    "trainer.n_workers",
    "trainer.validation_interval",
    "trainer.log_sub_losses",
    # UI-generated
    "trainer.epochs",
    "trainer.preprocessing.augmentations",
}


def _strip_reserved_keys(obj: dict, prefix: str = "") -> dict:
    """Recursively remove reserved keys from a config dict."""
    result = {}
    for key, value in obj.items():
        path = f"{prefix}.{key}" if prefix else key
        if path in _RESERVED_PATHS:
            continue
        if isinstance(value, dict):
            nested = _strip_reserved_keys(value, path)
            if nested:
                result[key] = nested
        else:
            result[key] = value
    return result


def generate_luxonis_config(model_config: ModelConfig, dir: str) -> str:
    config = {
        "model": generate_model_config(model_config),
        "loader": generate_loader_config(model_config, dir),
        "trainer": generate_trainer_config(model_config),
        "tracker": generate_tracker_config(model_config, dir),
    }

    custom = model_config.training_config.custom_hyperparams
    if custom:
        # custom = _strip_reserved_keys(custom)
        config = _deep_merge(config, custom)

    return yaml.dump(config, Dumper=_AnchorDumper)
