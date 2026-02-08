from multiprocessing import Process
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


def __upload_model(url: str, file_path: str, api_key: str) -> None:
    """Upload a model file to the webhook URL with proper error handling."""
    try:
        with open(file_path, "rb") as f:
            response = requests.post(
                url,
                files={"file": f},
                headers={"Authorization": api_key},
            )
            response.raise_for_status()
            print(f"Successfully uploaded model to {url}")
    except FileNotFoundError:
        print(f"Failed to upload model: file not found at {file_path}")
    except requests.exceptions.RequestException as e:
        print(f"Failed to upload model to {url}: {e}")


def run_training(config: ModelConfig):
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

        output_types = config.training_config.output_types
        webhook_url = get_config().webhook_url
        api_key = get_config().api_key

        if webhook_url is None:
            print("No webhook_url configured, skipping model upload")
            return

        if ModelOutputType.RAW in output_types:
            __upload_model(
                f"{webhook_url}/upload/{config.id}/raw",
                f"{dir}/{output_dir}/{ONNX_PATH}",
                api_key,
            )

        for output_type in filter(lambda x: x != ModelOutputType.RAW, output_types):
            try:
                print(f"Converting model to {output_type.value}...")
                res = convert_model(
                    path=f"{dir}/{output_dir}/{ONNX_PATH}",
                    output_dir=f"{dir}/converted/{output_type.value}",
                    target_format=output_type,
                )
                print(f"Conversion complete, uploading {output_type.value}...")
                __upload_model(
                    f"{webhook_url}/upload/{config.id}/{output_type.value}",
                    res.downloaded_path,
                    api_key,
                )
            except Exception as e:
                print(f"Failed to convert/upload {output_type.value}: {e}")


def train_model(config: ModelConfig):
    process = Process(target=run_training, args=(config,))
    process.start()
    return {"status": "Training started"}
