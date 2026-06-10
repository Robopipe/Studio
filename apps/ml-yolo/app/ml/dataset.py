import math
import random
import requests
import shutil
import yaml
import os
from concurrent.futures import ThreadPoolExecutor

from ..models.dataset_config import DatasetConfig
from ..models.image import Image
from ..models.model_type import ModelType

DATASET_DIR = "dataset"
DATASET_CONFIG = "dataset_config.yml"

IMAGE_DIR = "images"
LABEL_DIR = "labels"

TRAIN_DIR = "train"
VAL_DIR = "val"
TEST_DIR = "test"


def copy_image(image: Image, dest: str):
    image_path = image.file_url
    if image_path.startswith("http://") or image_path.startswith("https://"):
        response = requests.get(image_path, stream=True, timeout=30)
        if response.status_code == 200:
            filename = os.path.basename(image_path)
            dest_path = os.path.join(dest, filename)
            with open(dest_path, "wb") as out_file:
                shutil.copyfileobj(response.raw, out_file)
        else:
            raise Exception(f"Failed to download image from {image_path}")
    else:
        shutil.copy(image_path, dest)


def prepare_dirs(dir: str):
    train_dir = f"{dir}/{TRAIN_DIR}"
    val_dir = f"{dir}/{VAL_DIR}"
    test_dir = f"{dir}/{TEST_DIR}"

    for d in [train_dir, val_dir, test_dir]:
        shutil.os.makedirs(d, exist_ok=True)

    return train_dir, val_dir, test_dir


def get_label_mapping(config: DatasetConfig):
    pad = math.ceil(math.log10(len(config.labels) + 1))
    return {idx: str(label).rjust(pad, "0") for idx, label in enumerate(config.labels)}


def prepare_dataset_config(config: DatasetConfig, dir: str):
    config_path = f"{dir}/{DATASET_CONFIG}"
    with open(config_path, "w") as f:
        yaml.dump({"names": get_label_mapping(config)}, f)


def iterate_datasets(images: list[Image], config: DatasetConfig):
    shuffled_images = list(images)
    random.shuffle(shuffled_images)
    train_split, val_split, _ = (s / 100.0 for s in config.dataset_split)
    total_images = len(images)
    train_end = int(total_images * train_split)
    val_end = train_end + int(total_images * val_split)
    for idx, image in enumerate(shuffled_images):
        curr_dir = TEST_DIR
        if idx < train_end:
            curr_dir = TRAIN_DIR
        elif idx < val_end:
            curr_dir = VAL_DIR

        yield image, curr_dir


def prepare_classification_directory(
    dir: str, images: list[Image], config: DatasetConfig
):
    prepare_dirs(dir)
    label_mapping = get_label_mapping(config)
    for dir_type in [TRAIN_DIR, VAL_DIR, TEST_DIR]:
        for idx in range(len(config.labels)):
            label_dir = f"{dir}/{dir_type}/{label_mapping[idx]}"
            shutil.os.makedirs(label_dir, exist_ok=True)


def prepare_dataset(
    dir: str, images: list[Image], config: DatasetConfig, task_type: ModelType
):
    global VAL_DIR
    dir = f"{dir}/{DATASET_DIR}"
    image_dir = f"{dir}/{IMAGE_DIR}"
    label_dir = f"{dir}/{LABEL_DIR}"
    label_mapping = get_label_mapping(config)

    if task_type == ModelType.CLASSIFICATION:
        VAL_DIR = "valid"
        prepare_classification_directory(dir, images, config)
    else:
        prepare_dirs(image_dir)
        prepare_dirs(label_dir)
        prepare_dataset_config(config, dir)

    def _download_task(args):
        image, curr_dir = args
        if task_type == ModelType.CLASSIFICATION:
            label_name = label_mapping[image.labels[0].label.label_number]
            copy_image(image, f"{dir}/{curr_dir}/{label_name}")
        else:
            label_filename = (
                f"{os.path.splitext(os.path.basename(image.file_url))[0]}.txt"
            )
            copy_image(image, f"{image_dir}/{curr_dir}")
            with open(f"{label_dir}/{curr_dir}/{label_filename}", "w") as f:
                f.write("\n".join(image.labels_str(task_type)))

    tasks = list(iterate_datasets(images, config))
    max_workers = min(32, len(tasks) or 1)
    print(f"[ml-yolo] Downloading {len(tasks)} images using {max_workers} workers...")
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        list(executor.map(_download_task, tasks))
    print(f"[ml-yolo] Dataset preparation complete.")

