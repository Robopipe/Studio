from typing import Literal

from .augmentation import Augmentation, AugmentationParams


class PosterizeParams(AugmentationParams):
    num_bits: int = 4


class Posterize(Augmentation, A_TYPE="Posterize"):
    type: Literal["POSTERIZE"]
    params: PosterizeParams

    def to_config(self, img_size: tuple[int, int]):
        return [
            {
                "name": self.A_TYPE,
                "params": {
                    "num_bits": [self.params.num_bits, self.params.num_bits],
                    "p": self.params.p,
                },
            }
        ]
