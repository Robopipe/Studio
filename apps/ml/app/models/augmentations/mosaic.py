from typing import Literal

from .augmentation import Augmentation, AugmentationParams


class MosaicParams(AugmentationParams):
    rows: int = 2
    cols: int = 2


class Mosaic(Augmentation, A_TYPE="Mosaic"):
    type: Literal["MOSAIC"]
    params: MosaicParams

    def to_config(self):
        return [
            {
                "name": self.A_TYPE,
                "params": {
                    "grid_yx": [self.params.rows, self.params.cols],
                    "target_size": ["*height", "*width"],
                    "p": self.params.p,
                },
            }
        ]
