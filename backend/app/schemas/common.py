from typing import Literal
from pydantic import BaseModel

Platform = Literal["linkedin", "instagram", "x"]
LanguageMode = Literal["en", "ur", "roman_ur"]
BrandLanguagePreference = Literal["en", "ur", "roman_ur", "mixed"]
Objective = Literal["awareness", "engagement", "lead_generation", "sales", "announcement"]
RunStatus = Literal["success", "partial", "failed"]
PublishStatus = Literal["draft", "simulated"]


class ErrorInfo(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    detail: ErrorInfo
