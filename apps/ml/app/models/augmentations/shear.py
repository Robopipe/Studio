from typing import Literal

from .augmentation import Augmentation, AugmentationParams


class ShearParams(AugmentationParams):
    min: float = 0.0
    max: float = 0.0


class Shear(Augmentation, A_TYPE="Affine"):
    type: Literal["SHEAR"]
    params: ShearParams

    def to_config(self):
        return [
            {
                "name": self.A_TYPE,
                "params": {
                    "shear": (self.params.min, self.params.max),
                    "p": self.params.p,
                },
            }
        ]
