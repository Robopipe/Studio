from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings


class Config(BaseSettings):
    port: int = 8000
    host: str = "0.0.0.0"
    hubai_api_key: str
    webhook_url: Optional[str] = None

    class Config:
        env_file = ".env"


@lru_cache(maxsize=1)
def get_config() -> Config:
    return Config()
