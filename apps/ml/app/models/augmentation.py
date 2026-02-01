from enum import Enum


class AugmentationType(str, Enum):
    DEFOCUS = "Defocus"
    SHARPEN = "Sharpen"
    FLIP = "Flip"
