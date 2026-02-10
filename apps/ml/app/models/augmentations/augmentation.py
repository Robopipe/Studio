from pydantic import BaseModel

from typing import Type, ClassVar

AUG_REGISTRY: dict[str, list[Type["Augmentation"]]] = {}


class AugmentationParams(BaseModel):
    p: float = 0.5


class Augmentation(BaseModel):
    A_TYPE: ClassVar[str]
    type: str
    params: AugmentationParams

    @classmethod
    def __init_subclass__(cls, A_TYPE: str, **kwargs):
        super().__init_subclass__(**kwargs)
        cls.A_TYPE = A_TYPE
        if A_TYPE in AUG_REGISTRY:
            AUG_REGISTRY[A_TYPE].append(cls)
        else:
            AUG_REGISTRY[A_TYPE] = [cls]

    def to_config(self) -> list:
        return [{"name": self.A_TYPE, "params": self.params.model_dump()}]
