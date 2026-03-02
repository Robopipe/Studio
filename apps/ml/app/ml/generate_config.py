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
    augmentations_config = [
        aug
        for aug_list in model_config.training_config.dataset_config.augmentations
        for aug in aug_list.to_config()
    ]
    img_size = (
        (384, 512) if model_config.type != ModelType.CLASSIFICATION else (512, 512)
    )
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


def generate_luxonis_config(model_config: ModelConfig, dir: str) -> str:
    config = {
        "model": generate_model_config(model_config),
        "loader": generate_loader_config(model_config, dir),
        "trainer": generate_trainer_config(model_config),
        "tracker": generate_tracker_config(model_config, dir),
    }

    return yaml.dump(config, Dumper=_AnchorDumper)
