from django.conf import settings
import requests

import json
import os

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../models")
STATIC_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "../static/models"
)


def load_model_config(model_name):
    model_path = os.path.join(MODEL_DIR, model_name)

    if not os.path.exists(model_path):
        return None

    config_path = os.path.join(model_path, "config.json")

    if not os.path.exists(config_path):
        return None

    with open(config_path, "r") as f:
        return json.load(f)


def get_download_destination(model_name, config):
    if config.get("static", False):
        return os.path.join(STATIC_DIR, model_name, config["filename"])
    else:
        return os.path.join(MODEL_DIR, model_name, config["filename"])


def check_model_installed(model_name, config):
    for download in config.get("downloads", []):
        destination = get_download_destination(model_name, download)

        if not os.path.exists(destination):
            return False

    return True


def list_models():
    models = []

    for model in os.listdir(MODEL_DIR):
        model_path = os.path.join(MODEL_DIR, model)

        if not os.path.isdir(model_path):
            continue

        config = load_model_config(model)
        config["name"] = model
        config["installed"] = check_model_installed(model, config)
        models.append(config)

    return models


def install_model(model_name):
    config = load_model_config(model_name)

    if config is None:
        return False

    for download in config.get("downloads", []):
        destination = get_download_destination(model_name, download)

        if os.path.exists(destination):
            continue

        os.makedirs(os.path.dirname(destination), exist_ok=True)

        if not download.get("local", False):
            url = download["url"]
            r = requests.get(url)
            with open(destination, "wb") as f:
                f.write(r.content)

        if download.get("static", False):
            source = os.path.join(MODEL_DIR, model_name, download["filename"])
            os.symlink(source, destination)

    return True
