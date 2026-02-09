from typing import Literal

from .augmentation import Augmentation, AugmentationParams


class BrightnessParams(AugmentationParams):
    brightness_limit_min: float = -0.2
    brightness_limit_max: float = 0.2


class Brightness(Augmentation, A_TYPE="RandomBrightnessContrast"):
    type: Literal["BRIGHTNESS"]
    params: BrightnessParams

    def to_config(self):
        return [
            {
                "name": self.A_TYPE,
                "params": {
                    "brightness_limit": (
                        self.params.brightness_limit_min,
                        self.params.brightness_limit_max,
                    ),
                    "contrast_limit": (0, 0),
                    "p": self.params.p,
                },
            }
        ]
