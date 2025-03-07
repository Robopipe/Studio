import blobconverter as bc
import tensorflow_hub as hub
import tensorflowjs as tfjs
import tf_keras
import tempfile
import tf2onnx
import json
import os

from django.conf import settings
from django.utils._os import safe_join
from nn_models.utils.base import MODEL_DIR
from rest_framework.exceptions import ValidationError

from io import BytesIO


def convert_nn_model(request, model_name, base_model_name):
    if not request.FILES:
        raise ValidationError("No files uploaded")
    elif "model.json" not in request.FILES or "model.weights.bin" not in request.FILES:
        raise ValidationError("model.json or model.weights.bin not uploaded")

    json_content, weights_content = BytesIO(), BytesIO()
    for filename, file in request.FILES.items():
        if filename == "model.json":
            json_content.write(file.read())
        elif filename == "model.weights.bin":
            weights_content.write(file.read())

    json_content.seek(0)
    weights_content.seek(0)
    upload_model = tfjs.converters.deserialize_keras_model(
        json_content, [weights_content]
    )

    base_model_dir = safe_join(MODEL_DIR, base_model_name)
    base_model = hub.KerasLayer(
        safe_join(base_model_dir, "tf"),
        trainable=False,
        name="base_model",
    )

    with open(safe_join(base_model_dir, "config.json")) as f:
        base_model_config = json.load(f)
        input_height, input_width = base_model_config["input_shape"][1:3]
        input_shape = base_model_config["input_shape"]

    layers = [base_model, upload_model]

    imgsz = request.headers.get("X-imgsz")
    if imgsz is not None:
        imgsz = imgsz.lower().strip().split("x")
        w, h = int(imgsz[0]), int(imgsz[1])
        resize_layer = tf_keras.layers.Resizing(
            input_height, input_width, crop_to_aspect_ratio=True
        )
        layers.insert(0, resize_layer)
        input_height, input_width = h, w
        input_shape[1:3] = [h, w]

    model = tf_keras.Sequential(layers)
    model.build(input_shape)

    temp_onnx = tempfile.NamedTemporaryFile(mode="w+b", suffix=".onnx")
    tf2onnx.convert.from_keras(
        model,
        output_path=temp_onnx.name,
        inputs_as_nchw=model.input_names,
    )

    model_path = safe_join(settings.MODEL_ROOT, f"{model_name}.blob")
    saved_model_path = bc.from_onnx(
        temp_onnx.name,
        "FP16",
        [
            "--mean_values=[0,0,0]",
            "--scale_values=[255,255,255]",
            f"--input_shape=[1,3,{input_height},{input_width}]",
        ],
    )
    os.rename(saved_model_path, model_path)

    return f"{model_name}.blob"
