"""Ultralytics trainer callbacks that emit Robopipe-schema progress webhooks.

The payload shape must match what WebhookStats emits in apps/ml (the luxonis
backend), so the API's webhook handler doesn't need to branch. See
apps/ml/app/ml/callbacks.py for the reference schema.
"""

import math
from typing import Any, Optional

import requests

from ..models.model_type import ModelType


def _coerce_float(value: Any) -> Optional[float]:
    if value is None:
        return None
    if hasattr(value, "item"):
        try:
            value = value.item()
        except (TypeError, ValueError):
            return None
    try:
        v = float(value)
    except (TypeError, ValueError):
        return None
    return v if math.isfinite(v) else 0.0


class WebhookCallbacks:
    """Hook into Ultralytics' on_fit_epoch_end / on_train_end events."""

    # Canonical "accuracy" key per task type. These mirror what luxonis-train
    # calls accuracy so the API's log table stays consistent across backends.
    _ACC_KEY_MAP: dict[ModelType, str] = {
        ModelType.DETECTION: "metrics/mAP50-95(B)",
        ModelType.CLASSIFICATION: "metrics/accuracy_top1",
        ModelType.SEGMENTATION: "metrics/mAP50-95(M)",
    }
    # Fallback loss keys — Ultralytics reports per-component losses, not a
    # single summed "loss". We pick the most representative component.
    _LOSS_KEY_CANDIDATES: dict[ModelType, tuple[str, ...]] = {
        ModelType.DETECTION: ("val/box_loss", "train/box_loss", "val/loss"),
        ModelType.CLASSIFICATION: ("val/loss", "train/loss"),
        ModelType.SEGMENTATION: ("val/seg_loss", "val/box_loss", "val/loss"),
    }

    def __init__(
        self,
        webhook_url: str,
        api_key: str,
        model_id: int,
        model_type: ModelType,
        label_ids: list[int],
    ):
        self.webhook_url = webhook_url
        self.api_key = api_key
        self.model_id = model_id
        self.model_type = model_type
        self.label_ids = list(label_ids or [])
        self.acc_key = self._ACC_KEY_MAP[model_type]
        self.loss_candidates = self._LOSS_KEY_CANDIDATES[model_type]
        self.final_metrics: dict[str, Optional[float]] = {
            "accuracy": None,
            "loss": None,
        }
        self._last_epoch: int = -1

    # ---- Ultralytics callback entry point ----

    def on_fit_epoch_end(self, trainer: Any) -> None:
        """Fires after train + val for one epoch."""
        # Ultralytics' BaseTrainer.final_eval() re-runs validation on best.pt
        # after training and fires on_fit_epoch_end one extra time with the
        # same trainer.epoch. That payload only carries validator output, so
        # train/* losses (and often val/*_loss) are gone — our loss collapses
        # to 0.0 and corrupts the stats. Drop the duplicate.
        epoch = int(getattr(trainer, "epoch", 0))
        if epoch <= self._last_epoch:
            return

        raw_metrics = getattr(trainer, "metrics", {}) or {}
        metrics: dict[str, float] = {}
        for key, value in raw_metrics.items():
            coerced = _coerce_float(value)
            if coerced is not None:
                metrics[str(key)] = coerced

        accuracy = metrics.get(self.acc_key, 0.0)
        loss: Optional[float] = None
        for candidate in self.loss_candidates:
            if candidate in metrics:
                loss = metrics[candidate]
                break
        if loss is None:
            loss = 0.0

        metrics["accuracy"] = accuracy
        metrics["loss"] = loss
        self.final_metrics["accuracy"] = accuracy
        self.final_metrics["loss"] = loss

        payload = {
            "progress": {
                "type": "log",
                "epoch": epoch,
                "metrics": metrics,
                "perClassMetrics": self._per_class_metrics(trainer),
                "confusionMatrix": self._confusion_matrix(trainer),
            }
        }
        self._last_epoch = epoch
        try:
            r = requests.post(
                self.webhook_url, json=payload, headers={"Authorization": self.api_key}
            )
            r.raise_for_status()
        except requests.RequestException as e:
            print(f"[ml-yolo] Failed to POST progress: {e}")

    # ---- Per-class + confusion matrix extraction ----

    def _per_class_metrics(self, trainer: Any) -> dict[str, dict[str, float]]:
        """Return {metric_base: {db_label_id_str: value}} keyed by DB label IDs."""
        if not self.label_ids:
            return {}
        validator = getattr(trainer, "validator", None)
        metrics = getattr(validator, "metrics", None) if validator else None
        if metrics is None:
            return {}

        # Ultralytics' SegmentMetrics.maps returns box.maps + seg.maps (summed),
        # so per-class values come out ~2x. Use seg.maps directly to mirror the
        # headline accuracy key mAP50-95(M).
        if self.model_type == ModelType.SEGMENTATION:
            seg = getattr(metrics, "seg", None)
            maps = getattr(seg, "maps", None) if seg is not None else None
        else:
            maps = getattr(metrics, "maps", None)
        if maps is None:
            return {}

        bucket: dict[str, float] = {}
        try:
            iterable = list(maps)
        except TypeError:
            return {}
        for idx, val in enumerate(iterable):
            if idx >= len(self.label_ids):
                continue
            coerced = _coerce_float(val)
            if coerced is None:
                continue
            bucket[str(self.label_ids[idx])] = coerced
        if not bucket:
            return {}
        return {"metrics/mAP50-95_per_class": bucket}

    def _confusion_matrix(self, trainer: Any) -> dict[str, dict[str, Any]]:
        validator = getattr(trainer, "validator", None)
        cm = getattr(validator, "confusion_matrix", None) if validator else None
        matrix = getattr(cm, "matrix", None) if cm else None
        if matrix is None:
            return {}
        try:
            data = matrix.tolist()
        except (AttributeError, TypeError):
            return {}
        if not isinstance(data, list) or not data:
            return {}

        labels: list[Optional[str]] = [str(lid) for lid in self.label_ids]
        # Detection/segmentation matrices are (nc+1, nc+1) — extra bucket is background/no-match.
        if len(data) == len(self.label_ids) + 1:
            labels.append(None)
        # Classification matrices are (nc, nc) — no background bucket, nothing to append.

        head_name = {
            ModelType.DETECTION: "EfficientBBoxHead",
            ModelType.CLASSIFICATION: "ClassificationHead",
            ModelType.SEGMENTATION: "PrecisionSegmentBBoxHead",
        }[self.model_type]
        return {f"{head_name}/confusion_matrix": {"labels": labels, "matrix": data}}
