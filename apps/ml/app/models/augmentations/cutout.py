from typing import Literal

from .augmentation import Augmentation, AugmentationParams


class CutoutParams(AugmentationParams):
    pass


class Cutout(Augmentation, A_TYPE="GridDropout"):
    type: Literal["CUTOUT"]
    params: CutoutParams
