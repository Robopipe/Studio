import requests
import math
from numbers import Real
from typing import Optional

import lightning.pytorch as pl
from luxonis_train import LuxonisLightningModule
from luxonis_train.registry import CALLBACKS

from ..models.model_config import ModelType
from ..config import get_config


# Captures the latest epoch's accuracy/loss so run_training can forward them
# in the final `training-external/complete` webhook. Populated by WebhookStats.
FINAL_METRICS: dict[str, Optional[float]] = {"accuracy": None, "loss": None}


@CALLBACKS.register()
class WebhookStats(pl.Callback):
    LOSS_KEY = "val/loss"
    DEFAULT_NON_FINITE_VALUE = 0.0
    ACC_KEY_MAP = {
        ModelType.CLASSIFICATION: "val/metric/ClassificationHead/Accuracy",
        ModelType.DETECTION: "val/metric/EfficientBBoxHead/MeanAveragePrecision",
        ModelType.SEGMENTATION: "val/metric/PrecisionSegmentBBoxHead/MeanAveragePrecision",
    }

    def __init__(self, url: str, id: str, model_type: str, **kwargs):
        super().__init__()
        self.url = url
        self.model_id = id
        self.acc_key = self.ACC_KEY_MAP[ModelType(model_type)]
        self.api_key = get_config().api_key

    def on_train_epoch_end(
        self, trainer: pl.Trainer, pl_module: LuxonisLightningModule
    ):
        if (
            self.LOSS_KEY not in trainer.callback_metrics
            or self.acc_key not in trainer.callback_metrics
        ):
            return

        metrics: dict[str, float] = {}

        for key, value in trainer.callback_metrics.items():
            if hasattr(value, "item"):
                try:
                    raw_value = float(value.item())
                except (TypeError, ValueError):
                    continue
                metrics[key] = self._sanitize_metric_value(raw_value)
            elif isinstance(value, Real):
                metrics[key] = self._sanitize_metric_value(float(value))

        loss = metrics.get(self.LOSS_KEY)
        acc = metrics.get(self.acc_key)

        if loss is None or acc is None:
            return

        # Keep canonical keys required by the API while forwarding all trainer metrics.
        metrics["accuracy"] = acc
        metrics["loss"] = loss

        FINAL_METRICS["accuracy"] = acc
        FINAL_METRICS["loss"] = loss

        data = {
            "progress": {
                "type": "log",
                "epoch": trainer.current_epoch,
                "metrics": metrics,
            }
        }
        try:
            response = requests.post(
                self.url, json=data, headers={"Authorization": self.api_key}
            )
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            print(f"Failed to send webhook: {e}")

    def _sanitize_metric_value(self, value: float) -> float:
        if math.isfinite(value):
            return value

        return self.DEFAULT_NON_FINITE_VALUE
