from core.utils.io import get_temp_dir
from data_export.serializers import ExportDataSerializer
from django.conf import settings
from django.http.response import StreamingHttpResponse
import json
from label_studio_sdk.converter import Converter
import mimetypes
from projects.models import Project
import queue
import random
from rest_framework import generics, status
from rest_framework.response import Response
from ranged_fileresponse import RangedFileResponse
import shutil
from tasks.models import Task
from tempfile import mkdtemp
import threading
from ultralytics import YOLO
import yaml

import os

from nn_models.models import NNModel
from nn_models.serializers import NNModelSerializer, BaseModelSerializer
from nn_models.converter import convert_nn_model


class NNModelApi(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = []
    serializer_class = NNModelSerializer
    queryset = NNModel.objects.all()

    def get_queryset(self):
        return NNModel.objects.filter(id=self.kwargs.get("pk"))


class NNModelListApi(generics.ListCreateAPIView):
    serializer_class = NNModelSerializer
    queryset = NNModel.objects.all()

    def get_queryset(self):
        return NNModel.objects.filter(project_id=self.kwargs.get("pk")).order_by(
            "-updated_at"
        )

    def create(self, request, *args, **kwargs):
        request.data["project"] = self.kwargs.get("pk")
        request.data["model_path"] = "PLACEHOLDER"

        return super().create(request, *args, **kwargs)


class NNModelBaseModelListApi(generics.ListAPIView):
    def get(self, request, *args, **kwargs):
        return Response(os.listdir(os.path.join(settings.STATIC_ROOT, "models")))


class NNModelUploadApi(generics.CreateAPIView):
    serializer_class = NNModelSerializer

    def create(self, request, *args, **kwargs):
        nn_model = generics.get_object_or_404(NNModel, id=self.kwargs.get("pk"))
        nn_model.model_path = convert_nn_model(
            request, nn_model.name, nn_model.base_model
        )
        nn_model.save()

        return Response(NNModelSerializer(nn_model).data)


class NNModelFileResponse(generics.RetrieveAPIView):
    permission_classes = []

    def get(self, request, *args, **kwargs):
        filename = kwargs["filename"]
        file = (
            settings.MODEL_ROOT
            + ("/" if not settings.MODEL_ROOT.endswith("/") else "")
            + filename
        )

        if os.path.exists(file):
            content_type, encoding = mimetypes.guess_type(str(filename))
            content_type = content_type or "application/octet-stream"
            return RangedFileResponse(
                request, open(file, "rb"), content_type=content_type
            )

        return Response(status=status.HTTP_404_NOT_FOUND)


class NNModelTrainApi(generics.CreateAPIView):
    serializer_class = NNModelSerializer

    def get_queryset(self):
        return Project.objects

    def get_task_queryset(self, queryset):
        return queryset.select_related("project").prefetch_related(
            "annotations", "predictions"
        )

    def create(self, request, *args, **kwargs):
        import time

        project = self.get_object()
        config = request.data
        query = Task.objects.filter(project=project).filter(annotations__isnull=False)
        tasks = ExportDataSerializer(
            self.get_task_queryset(query), many=True, expand=["drafts"]
        ).data
        converter = Converter(
            config=project.get_parsed_config(),
            project_dir=None,
            upload_dir=os.path.join(settings.MEDIA_ROOT, settings.UPLOAD_DIR),
        )
        # with get_temp_dir() as tmp_dir:
        tmp_dir = mkdtemp()
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

        val_split = 0.1
        val_size = int(len(os.listdir(os.path.join(tmp_dir, "images"))) * val_split)

        images = os.listdir(os.path.join(tmp_dir, "images"))

        os.mkdir(os.path.join(tmp_dir, yolo_config["val"]))
        os.mkdir(os.path.join(tmp_dir, yolo_config["train"]))
        os.mkdir(os.path.join(tmp_dir, "labels", "train"))
        os.mkdir(os.path.join(tmp_dir, "labels", "val"))

        random.shuffle(images)

        for i, img in enumerate(images, start=1):
            print(img)
            try:
                if i <= val_size:
                    os.rename(
                        os.path.join(tmp_dir, "images", img),
                        os.path.join(tmp_dir, yolo_config["val"], img),
                    )
                    os.rename(
                        os.path.join(tmp_dir, "labels", img.replace("jpeg", "txt")),
                        os.path.join(
                            tmp_dir, "labels", "val", img.replace("jpeg", "txt")
                        ),
                    )
                else:
                    os.rename(
                        os.path.join(tmp_dir, "images", img),
                        os.path.join(tmp_dir, yolo_config["train"], img),
                    )
                    os.rename(
                        os.path.join(tmp_dir, "labels", img.replace("jpeg", "txt")),
                        os.path.join(
                            tmp_dir, "labels", "train", img.replace("jpeg", "txt")
                        ),
                    )
            except Exception as e:
                print("err", e)
                time.sleep(60)

        with open(os.path.join(tmp_dir, "config.yaml"), "w") as f:
            yaml.dump(yolo_config, f)

        def training_handle():
            q = queue.Queue()
            is_done = False

            def training_cb(trainer):
                q.put("epoch skoncil")
                if trainer.epoch == 50:
                    is_done = True

            def stream_cb():
                model = YOLO("yolov8n.pt")
                model.add_callback("on_train_epoch_end", training_cb)
                threading.Thread(
                    target=model.train,
                    kwargs={
                        "data": os.path.join(tmp_dir, "config.yaml"),
                        "epochs": 50,
                        "device": "mps",
                    },
                ).start()
                while not is_done:
                    item = q.get()
                    yield f"data: {item}\n\n"
                shutil.rmtree(tmp_dir)

            return stream_cb

        stream_cb = training_handle()
        return StreamingHttpResponse(stream_cb(), content_type="text/event-stream")
        # def stream_res():
        #     for i in range(10):
        #         time.sleep(1)
        #         yield f"data: {i}\n\n"

        # return Response(status=status.HTTP_200_OK)
