from pydantic import BaseModel


class DetectionInput(BaseModel):
    label: str
    confidence: float

    x1: float
    y1: float
    x2: float
    y2: float


class DescriptionResponse(BaseModel):
    description: str
    model: str