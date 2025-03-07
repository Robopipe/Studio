from nn_models.mixins import NNModelMixin
from django.db import models
from django.utils.translation import gettext_lazy as _


class NNModel(NNModelMixin, models.Model):
    class ModelType(models.TextChoices):
        Generic = "Generic", _("Generic")
        YOLO = "YOLO", _("YOLO")
        MobileNetSSD = "MobileNetSSD", _("MobileNetSSD")

    id = models.AutoField(
        auto_created=True,
        primary_key=True,
        serialize=False,
        verbose_name="ID",
        db_index=True,
    )
    created_at = models.DateTimeField(_("created_at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("updated_at"), auto_now=True)
    name = models.CharField(_("name"), max_length=255, unique=True)
    project = models.ForeignKey(
        "projects.Project",
        related_name="nn_models",
        on_delete=models.CASCADE,
        help_text="Project ID for this NNModel",
    )
    model_type = models.CharField(
        _("model_type"), max_length=255, choices=ModelType.choices
    )
    base_model = models.CharField(_("base_model"), max_length=255)
    model_path = models.CharField(_("model_path"), max_length=255)

    class Meta:
        db_table = "nn_model"
