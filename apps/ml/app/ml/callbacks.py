import requests

import lightning.pytorch as pl
from luxonis_train import LuxonisLightningModule
from luxonis_train.registry import CALLBACKS

from ..config import get_config


@CALLBACKS.register()
class WebhookStats(pl.Callback):
    def __init__(self, url: str, id: str, **kwargs):
        super().__init__()
        self.url = url
        self.model_id = id
        self.api_key = get_config().api_key

    def on_train_epoch_end(
        self, trainer: pl.Trainer, pl_module: LuxonisLightningModule
    ):
        metrics = trainer.callback_metrics
        keys = list(metrics.keys())
        acc_key, loss_key = None, None
        for key in keys:
            if key.endswith("Accuracy"):
                acc_key = key
            if key.endswith("Loss"):
                loss_key = key

        acc, loss = 0, 0
        if acc_key is not None:
            acc = metrics[acc_key].item()
        if loss_key is not None:
            loss = metrics[loss_key].item()

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
