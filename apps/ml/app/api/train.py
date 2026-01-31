from fastapi import APIRouter

from ..models.model_config import ModelConfig
from ..ml.train_model import train_model

router = APIRouter(prefix="/train", tags=["train"])


@router.post("/")
async def train(data: ModelConfig):
    return train_model(data)
