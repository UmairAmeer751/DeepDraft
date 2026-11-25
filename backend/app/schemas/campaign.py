from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from app.schemas.common import Platform, LanguageMode, Objective, RunStatus
from app.schemas.generation import GenerationRun


class CampaignCreate(BaseModel):
    brand_id: int
    topic: str = Field(min_length=1, max_length=500)
    key_message: str = Field(min_length=1, max_length=500)
    objective: Objective
    audience: str = Field(default="", max_length=500)
    cta: str = Field(default="", max_length=500)
    platforms: list[Platform] = Field(min_length=1, max_length=3)
    language_mode: LanguageMode

    @field_validator("platforms")
    @classmethod
    def validate_unique_platforms(cls, v: list[Platform]) -> list[Platform]:
        if len(v) != len(set(v)):
            raise ValueError("Platforms must be unique.")
        return v


class RunSummary(BaseModel):
    id: int
    language_mode: LanguageMode
    status: RunStatus
    created_at: datetime


class CampaignOut(BaseModel):
    id: int
    brand_id: int
    brand_name: str
    topic: str = Field(min_length=1, max_length=500)
    key_message: str = Field(min_length=1, max_length=500)
    objective: Objective
    audience: str = Field(default="", max_length=500)
    cta: str = Field(default="", max_length=500)
    platforms: list[Platform] = Field(min_length=1, max_length=3)
    language_mode: LanguageMode
    created_at: datetime
    latest_run: GenerationRun | None = None
    runs: list[RunSummary] = Field(default_factory=list)


class CampaignSummary(BaseModel):
    id: int
    brand_id: int
    brand_name: str
    topic: str
    language_mode: LanguageMode
    latest_run_status: RunStatus | None
    created_at: datetime
