"""Fetch a single image URL and decode into a BGR numpy array.

The API issues short-lived signed GCS URLs, but this works for any HTTPS
URL the model can serve. Stays in memory — no disk roundtrip — so we
don't need to clean anything up after serving the request.
"""

import ssl
import urllib.request

import certifi
import cv2
import numpy as np

_SSL_CONTEXT = ssl.create_default_context(cafile=certifi.where())


def fetch_image(url: str, timeout: float = 30.0) -> np.ndarray:
    req = urllib.request.Request(url, headers={"User-Agent": "ml-infer/0.1"})
    with urllib.request.urlopen(req, timeout=timeout, context=_SSL_CONTEXT) as resp:
        if resp.status != 200:
            raise RuntimeError(f"image fetch HTTP {resp.status}")
        data = resp.read()
    arr = np.frombuffer(data, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise RuntimeError("cv2 could not decode image bytes")
    return img
