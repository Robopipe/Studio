import shutil
import yaml
import os

from ..models.dataset_config import DatasetConfig
from ..models.image import Image

DATASET_DIR = "dataset"
DATASET_CONFIG = "dataset_config.yml"

IMAGE_DIR = "images"
LABEL_DIR = "labels"

TRAIN_DIR = "train"
VAL_DIR = "val"
TEST_DIR = "test"


def copy_images(images: list[str], dest: str):
    for image_path in images:
        shutil.copy(image_path, dest)


def prepare_dirs(dir: str):
    train_dir = f"{dir}/{TRAIN_DIR}"
    val_dir = f"{dir}/{VAL_DIR}"
    test_dir = f"{dir}/{TEST_DIR}"

    for d in [train_dir, val_dir, test_dir]:
        shutil.os.makedirs(d, exist_ok=True)

    return train_dir, val_dir, test_dir


def prepare_dataset_config(config: DatasetConfig, dir: str):
    config_path = f"{dir}/{DATASET_CONFIG}"
    labels = {"names": {idx: label for idx, label in enumerate(config.labels)}}
    with open(config_path, "w") as f:
        yaml.dump(labels, f)


def copy_image(image: Image, dest: str):
    # TODO: handle http(s) urls, s3, etc.
    shutil.copy(image.file_url, dest)


def prepare_dataset(dir: str, images: list[Image], config: DatasetConfig):
    dir = f"{dir}/{DATASET_DIR}"
    image_dir = f"{dir}/{IMAGE_DIR}"
    label_dir = f"{dir}/{LABEL_DIR}"
    prepare_dirs(image_dir)
    prepare_dirs(label_dir)
    prepare_dataset_config(config, dir)
    train_split, val_split, _ = (s / 100.0 for s in config.dataset_split)
    total_images = len(images)
    train_end = int(total_images * train_split)
    val_end = train_end + int(total_images * val_split)
    for idx, image in enumerate(images):
        curr_dir = TEST_DIR
        if idx < train_end:
            curr_dir = TRAIN_DIR
        elif idx < val_end:
            curr_dir = VAL_DIR

        label_filename = f"{os.path.splitext(os.path.basename(image.file_url))[0]}.txt"
        print(os.path.splitext(image.file_url))
        copy_image(image, f"{image_dir}/{curr_dir}")
        with open(f"{label_dir}/{curr_dir}/{label_filename}", "w") as f:
            f.write("\n".join(image.labels_str()))
