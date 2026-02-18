import requests

import lightning.pytorch as pl
from luxonis_train import LuxonisLightningModule
from luxonis_train.registry import CALLBACKS

from ..models.model_config import ModelType
from ..config import get_config


@CALLBACKS.register()
class WebhookStats(pl.Callback):
    LOSS_KEY = "val/loss"
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

        loss = trainer.logged_metrics[self.LOSS_KEY].item()
        acc = trainer.logged_metrics[self.acc_key].item()

        data = {
            "epoch": trainer.current_epoch,
            "metrics": {
                "accuracy": acc,
                "loss": loss,
            },
        }
        try:
            response = requests.post(
                self.url, json=data, headers={"Authorization": self.api_key}
            )
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            print(f"Failed to send webhook: {e}")
