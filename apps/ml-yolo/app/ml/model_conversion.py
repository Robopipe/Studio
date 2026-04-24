import os

from hubai_sdk import HubAIClient
from hubai_sdk.utils.sdk_models import ConvertResponse

from ..models.model_type import ModelOutputType


def convert_model(
    path: str, output_dir: str, target_format: ModelOutputType
) -> ConvertResponse:
    api_key = os.getenv("HUBAI_API_KEY")
    client = HubAIClient(api_key=api_key)
    conv_fn_map = {
        ModelOutputType.RVC2: client.convert.RVC2,
        ModelOutputType.RVC3: client.convert.RVC3,
        ModelOutputType.RVC4: client.convert.RVC4,
    }
    conv_params = {
        "path": path,
        "output_dir": output_dir,
        "quantization_mode": "FP16_STANDARD",
    }
    conv_fn = conv_fn_map.get(target_format)

    if conv_fn is None:
        raise ValueError(f"Unsupported target format: {target_format}")

    return conv_fn(**conv_params)
