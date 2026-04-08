from typing import Literal

from .augmentation import Augmentation, AugmentationParams


class MotionBlurParams(AugmentationParams):
    blur_limit: int = 7


class MotionBlur(Augmentation, A_TYPE="MotionBlur"):
    type: Literal["MOTION_BLUR"]
    params: MotionBlurParams
