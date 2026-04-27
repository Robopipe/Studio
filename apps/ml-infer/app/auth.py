"""Shared-secret auth for the ml-infer Cloud Run service.

Mirrors apps/api ApiKeyGuard: the caller (apps/api) puts the secret in
the Authorization header verbatim, and we compare against the value of
$ML_INFER_API_KEY at startup. Constant-time compare via hmac.
"""

import hmac
import os

from fastapi import Header, HTTPException, status

_EXPECTED = os.environ.get("ML_INFER_API_KEY", "")


def require_api_key(authorization: str | None = Header(default=None)) -> None:
    if not _EXPECTED:
        # Fail closed if the deploy forgot to set the env var, rather
        # than silently allowing every caller through.
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ML_INFER_API_KEY not configured",
        )
    if authorization is None or not hmac.compare_digest(authorization, _EXPECTED):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid or missing api key",
        )
