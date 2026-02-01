import yaml

from ..config import get_config
from ..models.model_config import ModelConfig
from .dataset import DATASET_DIR


def generate_model_config(model_config: ModelConfig) -> dict:
    config = {
        "name": str(model_config.id),
        "predefined_model": {
            "name": model_config.type.to_luxonis_model_type().value,
            "variant": "light",
        },
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
    config = {
        "batch_size": model_config.training_config.batch_size,
        "epochs": model_config.training_config.epochs,
        "n_workers": 8,
        "callbacks": [{"name": "ExportOnTrainEnd"}, {"name": "LearningRateMonitor"}],
    }

    if webhook_url is not None:
        config["callbacks"].append(
            {
                "name": "WebhookStats",
                "params": {"url": webhook_url, "id": model_config.id},
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

    return yaml.dump(config)
