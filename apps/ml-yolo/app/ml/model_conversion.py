import os
import uuid

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
    # Unique per call: hubai-sdk derives the HubAI model name from the input
    # filename when `name` is omitted, which for Ultralytics is always
    # `best.onnx` → slug "best". On a second run the slug-fallback in
    # convert.py:217 resolves to a public/foreign `best` and the server
    # rejects the variant with "Invalid team ID provided."
    conv_params = {
        "path": path,
        "output_dir": output_dir,
        "quantization_mode": "FP16_STANDARD",
        "name": f"robopipe-yolo-{uuid.uuid4().hex[:12]}",
    }
    conv_fn = conv_fn_map.get(target_format)

    if conv_fn is None:
        raise ValueError(f"Unsupported target format: {target_format}")

    return conv_fn(**conv_params)
