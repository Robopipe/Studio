from typing import Literal

from .augmentation import Augmentation, AugmentationParams


class ClaheParams(AugmentationParams):
    clip_limit: float = 4.0
    tile_grid_size: int = 8


class Clahe(Augmentation, A_TYPE="CLAHE"):
    type: Literal["CLAHE"]
    params: ClaheParams

    def to_config(self, img_size: tuple[int, int]):
        return [
            {
                "name": self.A_TYPE,
                "params": {
                    "clip_limit": [1.0, self.params.clip_limit],
                    "tile_grid_size": [
                        self.params.tile_grid_size,
                        self.params.tile_grid_size,
                    ],
                    "p": self.params.p,
                },
            }
        ]
