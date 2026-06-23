"""Ultralytics trainer callbacks that emit Robopipe-schema progress webhooks.

The payload shape must match what WebhookStats emits in apps/ml (the luxonis
backend), so the API's webhook handler doesn't need to branch. See
apps/ml/app/ml/callbacks.py for the reference schema.
"""

import math
import shutil
from pathlib import Path
import threading
from typing import Any, Optional

import requests

from ..models.model_type import ModelType


def _upload_checkpoint_worker(put_url: str, file_path: Path) -> None:
    try:
        if not file_path.exists():
            return
        with open(file_path, "rb") as f:
            r = requests.put(
                put_url,
                data=f,
                headers={"Content-Type": "application/octet-stream"},
                timeout=300,  # 5 minute timeout for large checkpoints
            )
            r.raise_for_status()
            # Split URL to avoid logging the signature
            print(f"[ml-yolo] Uploaded checkpoint to {put_url.split('?')[0]}")
    except Exception as e:
        print(f"[ml-yolo] Failed to upload checkpoint: {e}")


class CheckpointCallback:
    """Upload last.pt to GCS after each checkpoint save.

    Hooked on on_model_save, NOT on_fit_epoch_end: the trainer writes
    last.pt between those two callbacks, so reading it at on_fit_epoch_end
    races the write and can upload a torn file — which then poisons the
    Spot resume path (torch.load fails, the task crashes, Batch retries
    into the same corrupt checkpoint).

    last.pt is stable during on_model_save and untouched until the next
    epoch's save, so we snapshot it with a cheap local copy and upload the
    snapshot from a background thread — training never blocks on GCS.
    Single-flight: if the previous upload is still running, this epoch is
    skipped; the next save uploads a fresher checkpoint anyway. The lock
    also guarantees the snapshot file is never overwritten mid-upload.
    """

    def __init__(self, put_url: str):
        self.put_url = put_url
        self._upload_lock = threading.Lock()

    def on_model_save(self, trainer: Any) -> None:
        last_pt = Path(trainer.save_dir) / "weights" / "last.pt"
        if not last_pt.exists():
            return
        if not self._upload_lock.acquire(blocking=False):
            print("[ml-yolo] Previous checkpoint upload still in flight, skipping")
            return
        snapshot = last_pt.with_name("last_upload_snapshot.pt")
        try:
            shutil.copyfile(last_pt, snapshot)
        except Exception as e:
            self._upload_lock.release()
            print(f"[ml-yolo] Failed to snapshot checkpoint: {e}")
            return
        thread = threading.Thread(
            target=self._upload_and_release,
            args=(snapshot,),
            daemon=True,
        )
        thread.start()

    def _upload_and_release(self, snapshot: Path) -> None:
        try:
            _upload_checkpoint_worker(self.put_url, snapshot)
        finally:
            snapshot.unlink(missing_ok=True)
            self._upload_lock.release()


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
    # mAP@0.5 key per task type. Tracked separately so the API can store
    # `bestMap50` (max across epochs) for the model-card headline. Classification
    # has no mAP — left None and the FE falls back to finalAccuracy.
    _MAP50_KEY_MAP: dict[ModelType, Optional[str]] = {
        ModelType.DETECTION: "metrics/mAP50(B)",
        ModelType.CLASSIFICATION: None,
        ModelType.SEGMENTATION: "metrics/mAP50(M)",
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
        self.map50_key = self._MAP50_KEY_MAP[model_type]
        self.loss_candidates = self._LOSS_KEY_CANDIDATES[model_type]
        self.final_metrics: dict[str, Optional[float]] = {
            "accuracy": None,
            "loss": None,
            # Running max of mAP@50 across epochs; None for classification.
            "best_map50": None,
        }
        # We buffer one epoch ahead so final_eval's confusion matrix (the only
        # one Ultralytics ever populates — training-time validation runs with
        # plots=False) can be merged into the real last-epoch payload before
        # it ships. See on_fit_epoch_end / on_train_end below.
        self._pending_payload: Optional[dict] = None
        self._pending_epoch: int = -1

    # ---- Ultralytics callback entry point ----

    def on_fit_epoch_end(self, trainer: Any) -> None:
        """Fires after train + val for one epoch.

        Ultralytics' BaseTrainer.final_eval() re-runs validation on best.pt
        after training and fires this callback one extra time with the same
        trainer.epoch. That second payload only carries validator output, so
        train/* losses (and usually val/*_loss) are gone — naive emission
        produces a duplicate log row with loss=0 that corrupts stats. But
        the duplicate IS the only call where ConfusionMatrix is populated
        (final_eval flips plots=True), so we can't just drop it.

        Strategy: buffer the most recent real epoch's payload. On the
        duplicate, merge in the better confusionMatrix / perClassMetrics
        without touching loss/accuracy. Flush on the next real epoch or on
        on_train_end.
        """
        epoch = int(getattr(trainer, "epoch", 0))

        # Duplicate fire from final_eval — graft the better matrix/per-class
        # values onto the buffered payload and stop.
        if epoch == self._pending_epoch and self._pending_payload is not None:
            conf = self._confusion_matrix(trainer)
            if conf:
                self._pending_payload["progress"]["confusionMatrix"] = conf
            per_class = self._per_class_metrics(trainer)
            if per_class:
                self._pending_payload["progress"]["perClassMetrics"] = per_class
            return

        # Real epoch — flush whatever was buffered, then build a new payload.
        self._flush_pending()

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

        # Track the best mAP@50 so far (det/seg only). Falling values from a
        # later epoch shouldn't replace an earlier peak — best.pt is what gets
        # exported, so the card should reflect the best the model achieved.
        if self.map50_key is not None:
            current_map50 = metrics.get(self.map50_key)
            if current_map50 is not None:
                prev_best = self.final_metrics.get("best_map50")
                if prev_best is None or current_map50 > prev_best:
                    self.final_metrics["best_map50"] = current_map50

        self._pending_payload = {
            "progress": {
                "type": "log",
                "epoch": epoch,
                "metrics": metrics,
                "perClassMetrics": self._per_class_metrics(trainer),
                "confusionMatrix": self._confusion_matrix(trainer),
            }
        }
        self._pending_epoch = epoch

    def on_train_end(self, trainer: Any) -> None:
        """Fires once after final_eval. Flush the buffered last epoch — by
        now its confusion matrix has been merged with final_eval's output."""
        self._flush_pending()

    # ---- Internals ----

    def _flush_pending(self) -> None:
        if self._pending_payload is None:
            return
        payload = self._pending_payload
        self._pending_payload = None
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
