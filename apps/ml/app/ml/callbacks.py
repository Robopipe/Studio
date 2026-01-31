import lightning.pytorch as pl
from luxonis_train import LuxonisLightningModule
from luxonis_train.registry import CALLBACKS


@CALLBACKS.register()
class WebhookStats(pl.Callback):
    def __init__(self, url: str, id: str, **kwargs):
        super().__init__()
        self.url = url
        self.model_id = id

    def on_train_epoch_end(
        self, trainer: pl.Trainer, pl_module: LuxonisLightningModule
    ):
        print(
            "Sending webhook...",
            trainer.logged_metrics,
            trainer.callback_metrics,
            trainer.progress_bar_metrics,
        )
        import requests

        epoch = trainer.current_epoch
        message = f"Model {self.model_id} has completed epoch {epoch}."
        payload = {"text": message}
        try:
            response = requests.post(self.url, json=payload)
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            print(f"Failed to send webhook: {e}")
