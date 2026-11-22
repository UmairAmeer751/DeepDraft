import json
import re
from pathlib import Path
import pytest
from pydantic import ValidationError

from app.schemas.brand import BrandCreate, BrandOut, ExamplePostIn
from app.schemas.campaign import CampaignCreate, CampaignOut
from app.schemas.common import ErrorResponse
from app.schemas.generation import GenerationRun, PostUpdate

EXAMPLES = Path(__file__).resolve().parents[2] / "docs" / "examples"


def load_fixture(filename: str):
    with open(EXAMPLES / filename, "r", encoding="utf-8") as f:
        return json.load(f)


def test_brand_contract_fixture():
    data = load_fixture("brand.json")
    brand = BrandOut.model_validate(data)
    assert brand.id == data["id"]
    assert brand.name == data["name"]


def test_campaign_contract_fixture():
    data = load_fixture("campaign.json")
    campaign = CampaignOut.model_validate(data)
    assert campaign.id == data["id"]
    assert campaign.brand_name == data["brand_name"]


def test_generation_run_contract_fixture():
    data = load_fixture("generation_run.json")
    run = GenerationRun.model_validate(data)
    assert run.id == data["id"]
    assert run.status == "success"


def test_generation_run_ur_contract_fixture():
    data = load_fixture("generation_run_ur.json")
    run = GenerationRun.model_validate(data)
    assert run.id == data["id"]
    assert run.language_mode == "ur"

    urdu_char_pattern = re.compile(r"[\u0600-\u06FF]")
    assert len(run.posts) > 0
    for post in run.posts:
        assert urdu_char_pattern.search(post.text) is not None


def test_generation_run_failed_contract_fixture():
    data = load_fixture("generation_run_failed.json")
    error = ErrorResponse.model_validate(data)
    assert error.detail.code == data["detail"]["code"]


def test_negative_campaign_create_duplicate_platforms():
    with pytest.raises(ValidationError):
        CampaignCreate(
            brand_id=1,
            topic="Test Topic",
            key_message="Test Key Message",
            objective="awareness",
            platforms=["x", "x"],
            language_mode="en",
        )


def test_negative_campaign_create_invalid_language_mode():
    with pytest.raises(ValidationError):
        CampaignCreate(
            brand_id=1,
            topic="Test Topic",
            key_message="Test Key Message",
            objective="awareness",
            platforms=["x"],
            language_mode="fr",  # type: ignore[arg-type]
        )


def test_negative_post_update_no_fields():
    with pytest.raises(ValidationError):
        PostUpdate()


def test_negative_brand_create_eleven_example_posts():
    posts = [ExamplePostIn(platform="x", text=f"Sample post {i}") for i in range(11)]
    with pytest.raises(ValidationError):
        BrandCreate(
            name="Brand",
            industry="Tech",
            audience="Devs",
            language_preference="en",
            example_posts=posts,
        )
