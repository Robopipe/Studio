from django.urls import include, path

from . import api

app_name = "nn-models"

_urlpatterns = []

_api_urlpatterns = [
    path("base-models", api.NNModelBaseModelListApi.as_view(), name="base-model-list"),
    path("<int:pk>/", api.NNModelApi.as_view(), name="nn-model-detail"),
    path("<int:pk>/upload", api.NNModelUploadApi.as_view(), name="nn-model-upload"),
]

_api_projects_urlpatterns = [
    path("<int:pk>/nn-models", api.NNModelListApi.as_view(), name="nn-model-list"),
    path(
        "<int:pk>/nn-models/train",
        api.NNModelTrainApi.as_view(),
        name="nn-model-train",
    ),
]

urlpatterns = [
    path("api/nn-models/", include((_api_urlpatterns, app_name), namespace="api")),
    path(
        "api/projects/",
        include((_api_projects_urlpatterns, app_name), namespace="api-projects"),
    ),
    path(
        "data/model/<path:filename>",
        api.NNModelFileResponse.as_view(),
        name="data-model",
    ),
]
