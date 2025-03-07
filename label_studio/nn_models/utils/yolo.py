import json
import os
from queue import Queue
import random
import threading

import tools.yolo.yolov8_exporter
import yaml

import torch
import blobconverter as bc
from django.conf import settings
from label_studio_sdk.converter import Converter
from nn_models.models import NNModel
from nn_models.serializers import NNModelSerializer
from nn_models.utils.base import MODEL_DIR
from nn_models.utils.onnx import onnx_add_resize
from projects.models import Project
from tempfile import mkdtemp
from ultralytics import YOLO
import shutil


def list_dir_files(dir):
    return list(
        filter(lambda x: not os.path.isdir(os.path.join(dir, x)), os.listdir(dir))
    )


def _make_yolo_dataset_dirs(base_dir, dirs):
    for dir in dirs:
        os.makedirs(os.path.join(base_dir, dir))


def _make_images(base_dir, project_id):
    upload_dir = os.path.join(settings.MEDIA_ROOT, settings.UPLOAD_DIR, str(project_id))
    images_dir = os.path.join(base_dir, "images")

    for label in list_dir_files(os.path.join(base_dir, "labels")):
        label_image_name = os.path.splitext(label)
        image_name = None

        for image in os.listdir(upload_dir):
            if image.startswith(label_image_name):
                image_name = image
                break

        if image_name is not None:
            os.symlink(
                os.path.join(upload_dir, image_name),
                os.path.join(images_dir, image_name),
            )


def _split_dataset(base_dir, val_split):
    img_dir = os.path.join(base_dir, "images")
    labels_dir = os.path.join(base_dir, "labels")
    images = list_dir_files(img_dir)
    random.shuffle(images)
    split = int(len(images) * val_split)
    val_images = images[:split]
    train_images = images[split:]

    def mv_items(items, dest):
        for item in items:
            os.rename(
                os.path.join(img_dir, item),
                os.path.join(img_dir, dest, item),
            )
            label = os.path.splitext(item)[0] + ".txt"
            os.rename(
                os.path.join(labels_dir, label),
                os.path.join(labels_dir, dest, label),
            )

    mv_items(val_images, "val")
    mv_items(train_images, "train")


def prepare_yolo_dataset(project: Project, tasks, val_split=0.1) -> str:
    tmp_dir = mkdtemp()
    converter = Converter(
        project.get_parsed_config(),
        project_dir=None,
        upload_dir=os.path.join(settings.MEDIA_ROOT, settings.UPLOAD_DIR),
        download_resources=False,
    )
    yolo_config = {}

    input_json = os.path.join(tmp_dir, "config.json")
    with open(input_json, "w") as f:
        f.write(json.dumps(tasks, ensure_ascii=False))

    converter.convert(input_json, tmp_dir, "YOLO", is_dir=False)
    with open(os.path.join(tmp_dir, "classes.txt"), "r") as f:
        classes = f.read().splitlines()

    yolo_config["names"] = {str(i): classes[i] for i in range(len(classes))}
    yolo_config["path"] = tmp_dir
    yolo_config["train"] = "images/train"
    yolo_config["val"] = "images/val"

    _make_yolo_dataset_dirs(
        tmp_dir,
        [yolo_config["train"], yolo_config["val"], "labels/train", "labels/val"],
    )
    _make_images(tmp_dir, project.id)
    _split_dataset(tmp_dir, val_split)

    with open(os.path.join(tmp_dir, "config.yaml"), "w") as f:
        yaml.dump(yolo_config, f)

    return tmp_dir


def finish_model(
    model: YOLO,
    ls_project: Project,
    model_name: str,
    msg_queue: Queue,
    imgsz: tuple[int, int],
    **kwargs,
):
    model.train(**kwargs)
    model_path = os.path.join(kwargs["project"], "train/weights/best.pt")
    exporter = tools.yolo.yolov8_exporter.YoloV8Exporter(model_path, (640, 640), True)
    onnx_path = str(exporter.export_onnx())

    if imgsz != (640, 640):
        onnx_add_resize(onnx_path, imgsz)

    blob_path = bc.from_onnx(onnx_path)
    os.rename(blob_path, os.path.join(settings.MODEL_ROOT, f"{model_name}.blob"))
    nn_model = NNModel(
        project=ls_project,
        name=model_name,
        model_path=f"{model_name}.blob",
        base_model="yolov8n",
        model_type=NNModel.ModelType.YOLO,
    )
    nn_model.save()
    msg_queue.put({"log": "model trained", "status_type": "ready"})
    msg_queue.put({"result": NNModelSerializer(nn_model).data})
    shutil.rmtree(os.path.dirname(kwargs["data"]))
    shutil.rmtree(os.path.dirname(onnx_path))


def prepare_yolo(
    project: Project,
    tasks,
    model_name: str,
    base_model: str,
    imgsz: tuple[int, int],
):
    def stream_cb(epochs):
        msg_queue = Queue()
        is_done = False

        def training_cb(trainer):
            data = {"epoch": trainer.epoch, "metrics": trainer.metrics}
            msg_queue.put(
                {
                    "data": data,
                    "log": f"epoch {trainer.epoch}: {json.dumps(data['metrics'])}",
                }
            )

        yield json.dumps({"log": "preparing dataset", "status_type": "loading"})

        tmp_dir = prepare_yolo_dataset(project, tasks)

        yield json.dumps({"log": "dataset prepared", "status_type": "ready"})
        yield json.dumps({"log": "building model", "status_type": "loading"})

        model = YOLO(os.path.join(MODEL_DIR, base_model, "model.pt"))
        model.add_callback("on_fit_epoch_end", training_cb)

        yield json.dumps({"log": "model built", "status_type": "ready"})
        yield json.dumps({"log": "training model", "status_type": "loading"})

        if torch.cuda.is_available():
            device = "cuda"
        elif torch.mps.is_available():
            device = "mps"
        else:
            device = "cpu"

        threading.Thread(
            target=finish_model,
            args=(model, project, model_name, msg_queue, imgsz),
            kwargs={
                "data": os.path.join(tmp_dir, "config.yaml"),
                "epochs": epochs,
                "device": device,
                "project": tmp_dir,
            },
        ).start()

        while not is_done:
            msg = msg_queue.get()
            yield json.dumps(msg)

            if msg.get("data", {}).get("epoch", -1) == epochs:
                is_done = True

    return stream_cb
