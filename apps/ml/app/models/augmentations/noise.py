from typing import Literal

from .augmentation import Augmentation, AugmentationParams


class NoiseParams(AugmentationParams):
    std_min: float = 0.2
    std_max: float = 0.44
    mean_min: float = 0.0
    mean_max: float = 0.0
    per_channel: bool = False


class Noise(Augmentation, A_TYPE="GaussNoise"):
    type: Literal["NOISE"]
    params: NoiseParams

    def to_config(self):
        return [
            {
                "name": self.A_TYPE,
                "params": {
                    "std_range": (self.params.std_min, self.params.std_max),
                    "mean_range": (self.params.mean_min, self.params.mean_max),
                    "per_channel": self.params.per_channel,
                    "p": self.params.p,
                },
            }
        ]
