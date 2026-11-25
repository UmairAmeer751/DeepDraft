from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field, model_validator
from app.schemas.common import Platform, LanguageMode, RunStatus, PublishStatus, ErrorInfo


class GenerateRequest(BaseModel):
    language_mode: LanguageMode | None = None


class FormatCheck(BaseModel):
    rule: str
    passed: bool
    detail: str


class ScoreDimension(BaseModel):
    name: str
    score: float
    max: float
    explanation: str


class Score(BaseModel):
    total: float = Field(ge=0.0, le=100.0)
    status: Literal["experimental"]
    dimensions: list[ScoreDimension]


class GeneratedPost(BaseModel):
    id: int
    run_id: int
    platform: Platform
    language_mode: LanguageMode
    text: str
    hashtags: list[str]
    char_count: int
    format_checks: list[FormatCheck]
    score: Score | None
    edited: bool
    publish_status: PublishStatus
    created_at: datetime
    updated_at: datetime


class GenerationRun(BaseModel):
    id: int
    campaign_id: int
    language_mode: LanguageMode
    status: RunStatus
    provider: str
    model: str
    prompt_version: str
    error: ErrorInfo | None
    latency_ms: int | None
    created_at: datetime
    posts: list[GeneratedPost]


class PostUpdate(BaseModel):
    text: str | None = None
    hashtags: list[str] | None = None

    @model_validator(mode="after")
    def validate_at_least_one_field(self) -> "PostUpdate":
        if self.text is None and self.hashtags is None:
            raise ValueError("At least one field (text or hashtags) must be provided.")
        return self
