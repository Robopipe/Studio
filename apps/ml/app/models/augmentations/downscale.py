from typing import Literal

from .augmentation import Augmentation, AugmentationParams


class DownscaleParams(AugmentationParams):
    scale_min: float = 0.25
    scale_max: float = 0.5


class Downscale(Augmentation, A_TYPE="Downscale"):
    type: Literal["DOWNSCALE"]
    params: DownscaleParams

    def to_config(self, img_size: tuple[int, int]):
        return [
            {
                "name": self.A_TYPE,
                "params": {
                    "scale_range": [self.params.scale_min, self.params.scale_max],
                    "p": self.params.p,
                },
            }
        ]
