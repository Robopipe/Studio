from typing import Literal

from .augmentation import Augmentation, AugmentationParams


class RgbShiftParams(AugmentationParams):
    r_shift_limit: float = 0.2
    g_shift_limit: float = 0.2
    b_shift_limit: float = 0.2


class RgbShift(Augmentation, A_TYPE="RGBShift"):
    type: Literal["RGB_SHIFT"]
    params: RgbShiftParams
