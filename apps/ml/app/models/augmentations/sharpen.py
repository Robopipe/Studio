from typing import Literal

from .augmentation import Augmentation, AugmentationParams


class SharpenParams(AugmentationParams):
    alpha_min: float = 0.2
    alpha_max: float = 0.5
    lightness_min: float = 0.5
    lightness_max: float = 1.0


class Sharpen(Augmentation, A_TYPE="Sharpen"):
    type: Literal["SHARPEN"]
    params: SharpenParams

    def to_config(self, img_size: tuple[int, int]):
        return [
            {
                "name": self.A_TYPE,
                "params": {
                    "alpha": [self.params.alpha_min, self.params.alpha_max],
                    "lightness": [self.params.lightness_min, self.params.lightness_max],
                    "p": self.params.p,
                },
            }
        ]
