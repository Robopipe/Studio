from typing import Literal

from .augmentation import Augmentation, AugmentationParams


class FlipParams(AugmentationParams):
    horizontal: bool = True
    vertical: bool = False


class Flip(Augmentation, A_TYPE="FLIP"):
    type: Literal["FLIP"]
    params: FlipParams

    def to_config(self, img_size: tuple[int, int]):
        augs = []
        if self.params.horizontal:
            augs.append({"name": "HorizontalFlip", "params": {"p": self.params.p}})
        if self.params.vertical:
            augs.append({"name": "VerticalFlip", "params": {"p": self.params.p}})
        return augs
