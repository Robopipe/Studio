from typing import Literal

from .augmentation import Augmentation, AugmentationParams


class SaturationParams(AugmentationParams):
    min: float = -30.0
    max: float = 30.0


class Saturation(Augmentation, A_TYPE="HueSaturationValue"):
    type: Literal["SATURATION"]
    params: SaturationParams

    def to_config(self):
        return [
            {
                "name": self.A_TYPE,
                "params": {
                    "hue_shift_limit": [0, 0],
                    "sat_shift_limit": [self.params.min, self.params.max],
                    "val_shift_limit": [0, 0],
                    "p": self.params.p,
                },
            }
        ]
