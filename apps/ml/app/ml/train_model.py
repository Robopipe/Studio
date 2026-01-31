import os
import tempfile
import time
import shutil

from ..models.model_config import ModelConfig
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
        print("AAAAAAAAAAAAAAAA", dir)
        # time.sleep(60)  # wait for training to fully stop
        output_dir = next(filter(lambda x: x.startswith("0-"), os.listdir(dir)))
        print(output_dir)

        for output_type in config.output_types:
            convert_model(
                path=f"{dir}/{output_dir}/{ONNX_PATH}",
                output_dir=f"{dir}/converted/{output_type.value}",
                target_format=output_type,
            )

        # shutil.copytree(f"{dir}/converted", f"export/{config.id}")


def train_model(config: ModelConfig):
    __train(config)
    return {"status": "Training started"}
