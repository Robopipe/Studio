from typing import Literal

from .augmentation import Augmentation, AugmentationParams


class EqualizeParams(AugmentationParams):
    pass


class Equalize(Augmentation, A_TYPE="Equalize"):
    type: Literal["EQUALIZE"]
    params: EqualizeParams
