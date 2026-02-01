from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import APIKeyHeader

from ..config import get_config
from ..models.model_config import ModelConfig
from ..ml.train_model import train_model

router = APIRouter(prefix="/train", tags=["train"])
header_scheme = APIKeyHeader(name="Authorization", auto_error=False)
config = get_config()


@router.post("/")
async def train(data: ModelConfig, r: Request, api_key: str = Depends(header_scheme)):
    print(await r.json())
    if api_key != config.api_key:
        raise HTTPException(status_code=401, detail="Unauthorized")

    return train_model(data)
