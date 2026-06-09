import os

from hubai_sdk import HubAIClient
from hubai_sdk.services.models import delete_model
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
    conv_params: dict = {
        "path": path,
        "output_dir": output_dir,
    }
    if target_format == ModelOutputType.RVC4:
        conv_params["quantization_mode"] = "FP16_STANDARD"
    conv_fn = conv_fn_map.get(target_format)

    if conv_fn is None:
        raise ValueError(f"Unsupported target format: {target_format}")

    model_id = None
    try:
        result = conv_fn(**conv_params)
        model_id = result.instance.model_id
        return result
    finally:
        if model_id is not None:
            delete_model(model_id)
