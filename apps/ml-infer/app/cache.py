"""In-process LRU of loaded ONNX sessions, keyed by modelId.

The first request for a given model downloads the archive, loads the
ONNX session, and stores it. Subsequent requests for the same model id
hit the cache and skip both download and `InferenceSession` construction
(which is the expensive part — ~3-5 s for a ~110 MB seg model).

We cap by entry count rather than bytes; with ~110 MB per session and a
default cap of 4, peak resident is ~450 MB — well under the 4 GiB Cloud
Run instance.
"""

import logging
import shutil
import ssl
import tempfile
import threading
import urllib.request
from collections import OrderedDict
from pathlib import Path

import certifi

from .model import LoadedModel, load_model

_log = logging.getLogger(__name__)
_SSL_CONTEXT = ssl.create_default_context(cafile=certifi.where())


class ModelCache:
    def __init__(self, capacity: int = 4) -> None:
        self._capacity = capacity
        self._entries: "OrderedDict[int, LoadedModel]" = OrderedDict()
        # Per-model lock so a stampede of requests for the same fresh
        # model only downloads once. The outer lock guards the dict of
        # locks itself.
        self._download_locks: dict[int, threading.Lock] = {}
        self._dict_lock = threading.Lock()

    def get(self, model_id: int, model_url: str) -> LoadedModel:
        cached = self._touch(model_id)
        if cached is not None:
            return cached

        lock = self._lock_for(model_id)
        with lock:
            cached = self._touch(model_id)
            if cached is not None:
                return cached
            loaded = self._fetch_and_load(model_id, model_url)
            self._insert(model_id, loaded)
            return loaded

    def _touch(self, model_id: int) -> LoadedModel | None:
        with self._dict_lock:
            entry = self._entries.get(model_id)
            if entry is None:
                return None
            self._entries.move_to_end(model_id)
            return entry

    def _insert(self, model_id: int, loaded: LoadedModel) -> None:
        with self._dict_lock:
            self._entries[model_id] = loaded
            self._entries.move_to_end(model_id)
            while len(self._entries) > self._capacity:
                evicted_id, _ = self._entries.popitem(last=False)
                _log.info("evicted model %d from cache", evicted_id)

    def _lock_for(self, model_id: int) -> threading.Lock:
        with self._dict_lock:
            lock = self._download_locks.get(model_id)
            if lock is None:
                lock = threading.Lock()
                self._download_locks[model_id] = lock
            return lock

    def _fetch_and_load(self, model_id: int, model_url: str) -> LoadedModel:
        _log.info("fetching model %d from %s", model_id, _redact(model_url))
        target = Path(tempfile.mkdtemp(prefix=f"ml-infer-model-{model_id}-")) / "model.bin"
        req = urllib.request.Request(
            model_url, headers={"User-Agent": "ml-infer/0.1"}
        )
        with urllib.request.urlopen(req, timeout=120, context=_SSL_CONTEXT) as resp:
            if resp.status != 200:
                raise RuntimeError(f"model fetch HTTP {resp.status}")
            with open(target, "wb") as f:
                shutil.copyfileobj(resp, f)
        _log.info("loading model %d (%d bytes)", model_id, target.stat().st_size)
        return load_model(target)


def _redact(url: str) -> str:
    # Signed URLs carry secrets in the query string; keep them out of logs.
    return url.split("?", 1)[0]
