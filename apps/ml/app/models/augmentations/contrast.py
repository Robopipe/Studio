from typing import Literal

from .augmentation import Augmentation, AugmentationParams


class ContrastParams(AugmentationParams):
    contrast_limit_min: float = -0.2
    contrast_limit_max: float = 0.2


class Contrast(Augmentation, A_TYPE="RandomBrightnessContrast"):
    type: Literal["CONTRAST"]
    params: ContrastParams

    def to_config(self):
        return [
            {
                "name": self.A_TYPE,
                "params": {
                    "brightness_limit": [0, 0],
                    "contrast_limit": [
                        self.params.contrast_limit_min,
                        self.params.contrast_limit_max,
                    ],
                    "p": self.params.p,
                },
            }
        ]
