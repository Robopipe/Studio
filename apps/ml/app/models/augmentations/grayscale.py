from typing import Literal

from .augmentation import Augmentation, AugmentationParams


class GrayscaleParams(AugmentationParams):
    pass


class Grayscale(Augmentation, A_TYPE="ToGray"):
    type: Literal["GRAYSCALE"]
    params: GrayscaleParams
