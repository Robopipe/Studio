from typing import Literal

from .augmentation import Augmentation, AugmentationParams


class BlurParams(AugmentationParams):
    blur_limit: int = 7


class Blur(Augmentation, A_TYPE="Blur"):
    type: Literal["BLUR"]
    params: BlurParams
