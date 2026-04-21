from multiprocessing import Process
import os
import tempfile
import requests

from ..config import get_config
from ..models.model_config import ModelConfig
from ..models.model_type import ModelOutputType
from ..models.training_config import OutputUpload
from .dataset import prepare_dataset
from .generate_config import generate_luxonis_config, get_image_size
from .preprocess import preprocess_dataset
from .model import Model
from .model_conversion import convert_model
from .callbacks import *  # noqa: F401,F403  (registers LuxonisTrain callbacks)
from .callbacks import FINAL_METRICS


def __upload_to_signed_url(upload: OutputUpload, file_path: str) -> None:
    """PUT a file directly to a pre-signed GCS URL.

    Signed URLs embed auth in the query string — no Authorization header. The
    Content-Type must match what the backend signed the URL with (generic
    octet-stream, since we don't know the size up front).
    """
    try:
        with open(file_path, "rb") as f:
            response = requests.put(
                upload.url,
                data=f,
                headers={"Content-Type": "application/octet-stream"},
            )
            response.raise_for_status()
            print(f"Uploaded {upload.type.value} to {upload.object_path}")
    except FileNotFoundError:
        print(f"Failed to upload {upload.type.value}: file not found at {file_path}")
        raise
    except requests.exceptions.RequestException as e:
        print(f"Failed to upload {upload.type.value} to signed URL: {e}")
        raise


def __post_progress(webhook_url: str, api_key: str, model_id: int, payload: dict) -> None:
    try:
        response = requests.post(
            f"{webhook_url}/progress/{model_id}",
            json=payload,
            headers={"Authorization": api_key},
        )
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Failed to send progress webhook: {e}")


def __post_complete(webhook_url: str, api_key: str, model_id: int, payload: dict) -> None:
    try:
        response = requests.post(
            f"{webhook_url}/complete/{model_id}",
            json=payload,
            headers={"Authorization": api_key},
        )
        response.raise_for_status()
        print(f"Posted training-complete for model {model_id}")
    except requests.exceptions.RequestException as e:
        print(f"Failed to post training-complete: {e}")


def run_training(config: ModelConfig):
    ONNX_PATH = f"archive/{config.id}.onnx.tar.xz"
    try:
        with tempfile.TemporaryDirectory() as dir:
            luxonis_config = generate_luxonis_config(config, dir)
            config_path = f"{dir}/config.yml"
            prepare_dataset(
                dir, config.data, config.training_config.dataset_config, config.type
            )
            preprocess_cfg = config.training_config.dataset_config
            if preprocess_cfg.preprocessings:
                preprocess_dataset(
                    dir,
                    preprocess_cfg.preprocessings,
                    config.type,
                    get_image_size(config),
                )
            print(luxonis_config)
            with open(config_path, "w") as f:
                f.write(luxonis_config)
            model = Model(config_path)
            model.train()
            output_dir = next(filter(lambda x: x.startswith("0-"), os.listdir(dir)))

            output_types = config.training_config.output_types
            webhook_url = get_config().webhook_url
            api_key = get_config().api_key

            if webhook_url is None:
                print("No webhook_url configured, skipping model upload")
                return

            # Index uploads by type for quick lookup
            uploads_by_type: dict[ModelOutputType, OutputUpload] = {
                u.type: u for u in config.output_config
            }

            def upload_for(t: ModelOutputType) -> OutputUpload:
                upload = uploads_by_type.get(t)
                if upload is None:
                    raise RuntimeError(f"No signed upload URL for output type {t.value}")
                return upload

            completed_outputs: list[OutputUpload] = []

            if ModelOutputType.RAW in output_types:
                raw_upload = upload_for(ModelOutputType.RAW)
                __upload_to_signed_url(raw_upload, f"{dir}/{output_dir}/{ONNX_PATH}")
                completed_outputs.append(raw_upload)

            non_raw_types = [t for t in output_types if t != ModelOutputType.RAW]
            if non_raw_types:
                __post_progress(
                    webhook_url,
                    api_key,
                    config.id,
                    {"progress": {"type": "converting"}},
                )

            for output_type in non_raw_types:
                try:
                    print(f"Converting model to {output_type.value}...")
                    res = convert_model(
                        path=f"{dir}/{output_dir}/{ONNX_PATH}",
                        output_dir=f"{dir}/converted/{output_type.value}",
                        target_format=output_type,
                    )
                    print(f"Conversion complete, uploading {output_type.value}...")
                    conv_upload = upload_for(output_type)
                    __upload_to_signed_url(conv_upload, res.downloaded_path)
                    completed_outputs.append(conv_upload)
                except Exception as e:
                    print(f"Failed to convert/upload {output_type.value}: {e}")
                    raise

            __post_complete(
                webhook_url,
                api_key,
                config.id,
                {
                    "outputs": [
                        {"type": u.type.value, "objectPath": u.object_path}
                        for u in completed_outputs
                    ],
                    "finalAccuracy": FINAL_METRICS.get("accuracy"),
                    "finalLoss": FINAL_METRICS.get("loss"),
                },
            )
    except Exception as e:
        url = get_config().webhook_url
        api_key = get_config().api_key
        error_message = str(e)
        if url is not None:
            __post_progress(
                url,
                api_key,
                config.id,
                {"progress": {"type": "error", "errorMessage": error_message}},
            )
        else:
            print(f"Error during training: {error_message}")


def train_model(config: ModelConfig):
    process = Process(target=run_training, args=(config,))
    process.start()
    return {"status": "Training started"}
