from typing import Literal

from .augmentation import Augmentation, AugmentationParams


class ImageCompressionParams(AugmentationParams):
    quality_lower: int = 50
    quality_upper: int = 95


class ImageCompression(Augmentation, A_TYPE="ImageCompression"):
    type: Literal["IMAGE_COMPRESSION"]
    params: ImageCompressionParams

    def to_config(self, img_size: tuple[int, int]):
        return [
            {
                "name": self.A_TYPE,
                "params": {
                    "quality_range": [
                        self.params.quality_lower,
                        self.params.quality_upper,
                    ],
                    "p": self.params.p,
                },
            }
        ]
