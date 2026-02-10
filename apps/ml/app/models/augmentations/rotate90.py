from typing import Literal

from .augmentation import Augmentation, AugmentationParams


class Rotate90Params(AugmentationParams):
    pass


class Rotate90(Augmentation, A_TYPE="RandomRotate90"):
    type: Literal["ROTATE90"]
    params: Rotate90Params
