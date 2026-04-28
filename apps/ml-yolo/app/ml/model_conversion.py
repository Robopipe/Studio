import os
import uuid

from hubai_sdk import HubAIClient
from hubai_sdk.utils.sdk_models import ConvertResponse

from ..models.model_type import ModelOutputType


def convert_model(
    path: str,
    output_dir: str,
    target_format: ModelOutputType,
    quantization_mode: str = "FP16_STANDARD",
    quantization_data: str | None = None,
) -> ConvertResponse:
    """Submit `path` to HubAI for the given RVC* target.

    `quantization_mode` is forwarded as-is to hubai-sdk. Allowed values are
    "FP16_STANDARD" and "INT8_STANDARD".

    `quantization_data` selects the calibration set used for INT8 modes.
    Either a predefined domain (GENERAL, INDOORS, WAREHOUSE, DRIVING, FOOD,
    RANDOM) or a HubAI dataset id starting with "aid_". Ignored for FP16.
    Defaults to None, which makes hubai-sdk fall back to RANDOM for INT8 —
    callers that want INT8 should pass a domain explicitly.
    """
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
    conv_params: dict = {
        "path": path,
        "output_dir": output_dir,
        "quantization_mode": quantization_mode,
        "name": f"robopipe-yolo-{uuid.uuid4().hex[:12]}",
    }
    if quantization_data is not None:
        conv_params["quantization_data"] = quantization_data
    conv_fn = conv_fn_map.get(target_format)

    if conv_fn is None:
        raise ValueError(f"Unsupported target format: {target_format}")

    return conv_fn(**conv_params)
