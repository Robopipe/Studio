import os
import tempfile
import requests

from ..config import get_config
from ..models.model_config import ModelConfig
from ..models.model_type import ModelOutputType
from .dataset import prepare_dataset
from .generate_config import generate_luxonis_config
from .model import Model
from .model_conversion import convert_model
from .callbacks import *


def __train(config: ModelConfig):
    ONNX_PATH = f"export/{config.id}.onnx"
    with tempfile.TemporaryDirectory() as dir:
        luxonis_config = generate_luxonis_config(config, dir)
        config_path = f"{dir}/config.yml"
        prepare_dataset(dir, config.data, config.training_config.dataset_config)
        with open(config_path, "w") as f:
            f.write(luxonis_config)
        model = Model(config_path, debug_mode=True)
        model.train()
        output_dir = next(filter(lambda x: x.startswith("0-"), os.listdir(dir)))

        if ModelOutputType.RAW in config.output_types:
            requests.post(
                f"{get_config().webhook_url}/upload/{config.id}/raw",
                files={"file": open(f"{dir}/{output_dir}/{ONNX_PATH}", "rb")},
                headers={"Authorization": get_config().api_key},
            )

        for output_type in filter(
            lambda x: x != ModelOutputType.RAW, config.output_types
        ):
            res = convert_model(
                path=f"{dir}/{output_dir}/{ONNX_PATH}",
                output_dir=f"{dir}/converted/{output_type.value}",
                target_format=output_type,
            )
            requests.post(
                f"{get_config().webhook_url}/upload/{config.id}/{output_type.value}",
                files={"file": open(res.downloaded_path, "rb")},
                headers={"Authorization": get_config().api_key},
            )


def train_model(config: ModelConfig):
    __train(config)
    return {"status": "Training started"}
