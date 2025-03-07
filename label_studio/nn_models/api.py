from data_export.serializers import ExportDataSerializer
from django.conf import settings
from django.http.response import StreamingHttpResponse
import mimetypes
from nn_models.utils.yolo import prepare_yolo
from nn_models.utils.base import list_models
from projects.models import Project
from rest_framework import generics, status
from rest_framework.response import Response
from ranged_fileresponse import RangedFileResponse
from tasks.models import Task

import os

from nn_models.models import NNModel
from nn_models.serializers import NNModelSerializer
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
        models = list_models()

        if (task := request.query_params.get("task", None)) is not None:
            models = list(filter(lambda x: x.get("task", None) == task, models))

        return Response(
            [model["name"] for model in models if model.get("installed", False)]
        )


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
        project = self.get_object()
        config = request.data
        query = Task.objects.filter(project=project).filter(annotations__isnull=False)
        tasks = ExportDataSerializer(
            self.get_task_queryset(query), many=True, expand=["drafts"]
        ).data
        imgsz = config.get("imgsz")

        if imgsz is not None:
            imgsz = imgsz.lower().strip().split("x")
            imgsz = int(imgsz[1]), int(imgsz[0])

        stream_cb = prepare_yolo(
            project,
            tasks,
            config["model_name"],
            config["base_model"],
            imgsz or (640, 640),
        )

        return StreamingHttpResponse(
            stream_cb(int(config.get("epochs") or 50)), content_type="text/event-stream"
        )
