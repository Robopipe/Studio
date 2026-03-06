from typing import Literal

from .augmentation import Augmentation, AugmentationParams


class RotationParams(AugmentationParams):
    min: int = -90
    max: int = 90


class Rotation(Augmentation, A_TYPE="Rotate"):
    type: Literal["ROTATION"]
    params: RotationParams

    def to_config(self, img_size: tuple[int, int]):
        return [
            {
                "name": self.A_TYPE,
                "params": {
                    "limit": [self.params.min, self.params.max],
                    "p": self.params.p,
                },
            }
        ]
