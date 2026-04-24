import sys
import requests

from .config import get_config
from .models.model_config import ModelConfig
from .ml.train_model import run_training


def main() -> int:
    config = get_config()

    if not config.config_url:
        print("ERROR: CONFIG_URL environment variable is required for job mode")
        return 1

    try:
        print(f"Downloading training config from signed URL...")
        response = requests.get(config.config_url)
        response.raise_for_status()

        model_config = ModelConfig(**response.json())
        print(f"Starting training for model {model_config.id}")

        run_training(model_config)
        print(f"Training completed for model {model_config.id}")
        return 0
    except Exception as e:
        print(f"Training failed: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
