from fastapi import FastAPI
import uvicorn

from .api.train import router as train_router
from .config import get_config

config = get_config()

app = FastAPI()
app.include_router(train_router)


@app.get("/")
def hello():
    return "Hello from Robopipe ML Service!"


def main():
    uvicorn.run(app, host="0.0.0.0", port=config.port)


if __name__ == "__main__":
    main()
