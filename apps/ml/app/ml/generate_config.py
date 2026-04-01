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


def get_model_params(model_config: ModelConfig) -> tuple[dict, dict]:
    if model_config.type == ModelType.CLASSIFICATION:
        return {"variant": "light"}, {}
    elif model_config.type == ModelType.DETECTION:
        return {"variant": "light"}, {}
    elif model_config.type == ModelType.SEGMENTATION:
        return {"variant": "light"}, {}


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
    has_custom = bool(model_config.training_config.custom_hyperparams)
    img_size = (
        (480, 640) if model_config.type != ModelType.CLASSIFICATION else (512, 512)
    )
    augmentations_config = [
        aug
        for aug_list in model_config.training_config.dataset_config.augmentations
        for aug in aug_list.to_config(img_size)
    ]
    config = {
        "batch_size": model_config.training_config.batch_size,
        "epochs": model_config.training_config.epochs,
        "n_workers": 8,
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
    "model.predefined_model.variant",
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
    "trainer.preprocessing.train_image_size",
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
        custom = _strip_reserved_keys(custom)
        config = _deep_merge(config, custom)

    return yaml.dump(config, Dumper=_AnchorDumper)
