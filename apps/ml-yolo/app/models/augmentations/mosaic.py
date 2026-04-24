from typing import Literal

from .augmentation import Augmentation, AugmentationParams


class MosaicParams(AugmentationParams):
    rows: int = 2
    cols: int = 2


class Mosaic(Augmentation, A_TYPE="Mosaic4"):
    type: Literal["MOSAIC"]
    params: MosaicParams

    def to_config(self, img_size: tuple[int, int]):
        return [
            {
                "name": self.A_TYPE,
                "params": {
                    "out_height": img_size[0],
                    "out_width": img_size[1],
                    "p": self.params.p,
                },
            }
        ]
