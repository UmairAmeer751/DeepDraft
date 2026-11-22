from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.common import Platform, BrandLanguagePreference


class ExamplePostIn(BaseModel):
    platform: Platform
    text: str = Field(min_length=1, max_length=3000)


class ExamplePostOut(ExamplePostIn):
    id: int


class BrandCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    industry: str = Field(min_length=1, max_length=200)
    audience: str = Field(min_length=1, max_length=200)
    tone: list[str] = Field(default_factory=list)
    language_preference: BrandLanguagePreference
    guidelines: str = Field(default="", max_length=5000)
    prohibited_phrases: list[str] = Field(default_factory=list)
    example_posts: list[ExamplePostIn] = Field(default_factory=list, max_length=10)


class BrandOut(BaseModel):
    id: int
    name: str = Field(min_length=1, max_length=200)
    industry: str = Field(min_length=1, max_length=200)
    audience: str = Field(min_length=1, max_length=200)
    tone: list[str] = Field(default_factory=list)
    language_preference: BrandLanguagePreference
    guidelines: str = Field(default="", max_length=5000)
    prohibited_phrases: list[str] = Field(default_factory=list)
    example_posts: list[ExamplePostOut] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class BrandSummary(BaseModel):
    id: int
    name: str
    industry: str
    language_preference: BrandLanguagePreference
    example_count: int
    created_at: datetime
