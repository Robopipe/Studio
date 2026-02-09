from typing import Literal

from .augmentation import Augmentation, AugmentationParams


class CropParams(AugmentationParams):
    scale_min: float = 0.08
    scale_max: float = 1.0


class Crop(Augmentation, A_TYPE="RandomResizedCrop"):
    type: Literal["CROP"]
    params: CropParams

    def to_config(self):
        return [
            {
                "name": self.A_TYPE,
                "params": {
                    "size": ["*width", "*height"],
                    "scale": [self.params.scale_min, self.params.scale_max],
                },
            }
        ]
