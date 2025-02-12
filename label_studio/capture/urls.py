from django.urls import include, path

from . import views

app_name = "capture"

_urlpatterns = [
    path("", views.capture_interface, name="capture-index"),
]

urlpatterns = [
    path("capture/", include(_urlpatterns)),
]
