from pydantic import BaseModel


class Label(BaseModel):
    label_number: int
