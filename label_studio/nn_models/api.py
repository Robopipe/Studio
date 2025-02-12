from django.conf import settings
from rest_framework import generics, status
from rest_framework.response import Response
from ranged_fileresponse import RangedFileResponse
import mimetypes

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
        return NNModel.objects.filter(project_id=self.kwargs.get("pk"))

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
