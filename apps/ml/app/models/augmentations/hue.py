from typing import Literal

from .augmentation import Augmentation, AugmentationParams


class HueParams(AugmentationParams):
    hue_shift_limit_min: float = -20.0
    hue_shift_limit_max: float = 20.0


class Hue(Augmentation, A_TYPE="HueSaturationValue"):
    type: Literal["HUE"]
    params: HueParams

    def to_config(self):
        return [
            {
                "name": self.A_TYPE,
                "params": {
                    "hue_shift_limit": [
                        self.params.hue_shift_limit_min,
                        self.params.hue_shift_limit_max,
                    ],
                    "sat_shift_limit": [0, 0],
                    "val_shift_limit": [0, 0],
                    "p": self.params.p,
                },
            }
        ]
