from typing import Literal

from .augmentation import Augmentation, AugmentationParams


class PerspectiveParams(AugmentationParams):
    scale: float = 0.05


class Perspective(Augmentation, A_TYPE="Perspective"):
    type: Literal["PERSPECTIVE"]
    params: PerspectiveParams

    def to_config(self, img_size: tuple[int, int]):
        return [
            {
                "name": self.A_TYPE,
                "params": {
                    "scale": [0.0, self.params.scale],
                    "p": self.params.p,
                },
            }
        ]
