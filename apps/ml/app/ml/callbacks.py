import re
import requests
import math
from numbers import Real
from typing import Any, Optional

import lightning.pytorch as pl
from luxonis_train import LuxonisLightningModule
from luxonis_train.registry import CALLBACKS

from ..models.model_config import ModelType
from ..config import get_config


# Captures the latest epoch's accuracy/loss so run_training can forward them
# in the final `training-external/complete` webhook. Populated by WebhookStats.
FINAL_METRICS: dict[str, Optional[float]] = {"accuracy": None, "loss": None}


# Per-class metric key patterns emitted by luxonis-train 0.4.1.
# The trailing integer is the internal class index (0..N-1) that we translate
# back to a DB label ID via `label_ids[idx]`.
#
# 1. TorchMetricWrapper output for Classification/Segmentation —
#    `<...>/Multiclass<MetricName>_<idx>`.
# 2. MeanAveragePrecision postprocess output for Detection / InstanceSegmentation —
#    `<...>_per_class_<idx>` (also matches `bbox_*_per_class_<idx>` and
#    `segm_*_per_class_<idx>` used by the instance-segmentation head).
_PER_CLASS_PATTERNS = (
    re.compile(r"^(?P<base>.+/Multiclass[A-Za-z]+)_(?P<idx>\d+)$"),
    re.compile(r"^(?P<base>.+_per_class)_(?P<idx>\d+)$"),
)


@CALLBACKS.register()
class WebhookStats(pl.Callback):
    LOSS_KEY = "val/loss"
    DEFAULT_NON_FINITE_VALUE = 0.0
    ACC_KEY_MAP = {
        ModelType.CLASSIFICATION: "val/metric/ClassificationHead/Accuracy",
        ModelType.DETECTION: "val/metric/EfficientBBoxHead/MeanAveragePrecision",
        ModelType.SEGMENTATION: "val/metric/PrecisionSegmentBBoxHead/MeanAveragePrecision",
    }

    def __init__(
        self,
        url: str,
        id: str,
        model_type: str,
        label_ids: Optional[list[int]] = None,
        **kwargs,
    ):
        super().__init__()
        self.url = url
        self.model_id = id
        self.acc_key = self.ACC_KEY_MAP[ModelType(model_type)]
        self.api_key = get_config().api_key
        self.label_ids = list(label_ids) if label_ids else []
        # Populated in on_validation_epoch_end (runs before LightningModule's
        # hook resets metric state) and consumed in on_train_epoch_end.
        self._confusion_matrix: dict[str, dict[str, Any]] = {}

    def on_validation_epoch_end(
        self, trainer: pl.Trainer, pl_module: LuxonisLightningModule
    ):
        # Capture confusion matrices before luxonis-train's own
        # on_validation_epoch_end resets the metric state. Callback hooks fire
        # before the LightningModule's hook, so `metric.compute()` sees the
        # fully populated validation state.
        self._confusion_matrix = {}
        try:
            nodes = pl_module.nodes.items()
        except Exception:
            return

        for node_name, node in nodes:
            module = getattr(node, "module", node)
            try:
                class_names = list(getattr(module, "class_names", []) or [])
            except (RuntimeError, AttributeError):
                class_names = []
            labels_translated = [
                str(self.label_ids[i]) if i < len(self.label_ids) else None
                for i in range(len(class_names))
            ]

            metrics_dict = getattr(node, "metrics", None)
            if not metrics_dict:
                continue

            for metric in metrics_dict.values():
                if "ConfusionMatrix" not in type(metric).__name__:
                    continue
                try:
                    result = metric.compute()
                except Exception as e:
                    print(
                        f"Failed to compute confusion matrix for node "
                        f"{node_name!r}: {e}"
                    )
                    continue

                items = (
                    result.items()
                    if isinstance(result, dict)
                    else [("confusion_matrix", result)]
                )
                for key, tensor in items:
                    if not key.endswith("confusion_matrix"):
                        continue
                    matrix = self._tensor_to_matrix(tensor)
                    if matrix is None:
                        continue

                    rows = len(matrix)
                    labels = list(labels_translated)
                    if rows == len(labels_translated) + 1:
                        labels.append(None)  # trailing "no match" / background bucket

                    self._confusion_matrix[f"{node_name}/{key}"] = {
                        "labels": labels,
                        "matrix": matrix,
                    }

    def _tensor_to_matrix(self, tensor) -> Optional[list[list[float]]]:
        if not hasattr(tensor, "detach") or not hasattr(tensor, "dim"):
            return None
        try:
            if tensor.dim() != 2:
                return None
            return tensor.detach().cpu().tolist()
        except Exception:
            return None

    def on_train_epoch_end(
        self, trainer: pl.Trainer, pl_module: LuxonisLightningModule
    ):
        if (
            self.LOSS_KEY not in trainer.callback_metrics
            or self.acc_key not in trainer.callback_metrics
        ):
            return

        metrics: dict[str, float] = {}
        per_class_raw: dict[str, dict[int, float]] = {}

        for key, value in trainer.callback_metrics.items():
            scalar = self._coerce_scalar(value)
            if scalar is None:
                continue
            sanitized = self._sanitize_metric_value(scalar)

            match = self._match_per_class(key)
            if match is not None:
                base, idx = match
                per_class_raw.setdefault(base, {})[idx] = sanitized
            else:
                metrics[key] = sanitized

        loss = metrics.get(self.LOSS_KEY)
        acc = metrics.get(self.acc_key)

        if loss is None or acc is None:
            return

        # Keep canonical keys required by the API while forwarding all trainer metrics.
        metrics["accuracy"] = acc
        metrics["loss"] = loss

        FINAL_METRICS["accuracy"] = acc
        FINAL_METRICS["loss"] = loss

        per_class_metrics = self._translate_per_class_ids(per_class_raw)
        confusion_matrix = self._confusion_matrix
        # Clear so a stale matrix cannot leak to a later epoch if validation
        # is skipped (not expected under validation_interval=1, but defensive).
        self._confusion_matrix = {}

        data = {
            "progress": {
                "type": "log",
                "epoch": trainer.current_epoch,
                "metrics": metrics,
                "perClassMetrics": per_class_metrics,
                "confusionMatrix": confusion_matrix,
            }
        }
        try:
            response = requests.post(
                self.url, json=data, headers={"Authorization": self.api_key}
            )
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            print(f"Failed to send webhook: {e}")

    def _coerce_scalar(self, value) -> Optional[float]:
        if hasattr(value, "item"):
            try:
                return float(value.item())
            except (TypeError, ValueError):
                return None
        if isinstance(value, Real):
            return float(value)
        return None

    def _match_per_class(self, key: str) -> Optional[tuple[str, int]]:
        for pattern in _PER_CLASS_PATTERNS:
            m = pattern.match(key)
            if m is not None:
                return m.group("base"), int(m.group("idx"))
        return None

    def _translate_per_class_ids(
        self, per_class_raw: dict[str, dict[int, float]]
    ) -> dict[str, dict[str, float]]:
        """Convert internal class indices to DB label IDs (as string keys).

        Unknown indices (outside the configured label range) are dropped — it
        would be misleading to report them under a wrong label.
        """
        translated: dict[str, dict[str, float]] = {}
        for base, per_idx in per_class_raw.items():
            bucket: dict[str, float] = {}
            for idx, val in per_idx.items():
                if 0 <= idx < len(self.label_ids):
                    bucket[str(self.label_ids[idx])] = val
            if bucket:
                translated[base] = bucket
        return translated

    def _sanitize_metric_value(self, value: float) -> float:
        if math.isfinite(value):
            return value

        return self.DEFAULT_NON_FINITE_VALUE
