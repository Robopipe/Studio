from typing import Literal

from .augmentation import Augmentation, AugmentationParams


class MedianBlurParams(AugmentationParams):
    blur_limit: int = 5


class MedianBlur(Augmentation, A_TYPE="MedianBlur"):
    type: Literal["MEDIAN_BLUR"]
    params: MedianBlurParams
