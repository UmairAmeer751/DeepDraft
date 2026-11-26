import json
import re
from pathlib import Path

import pytest

from app.schemas.brand import BrandOut
from app.schemas.campaign import CampaignOut
from app.services.brand_context import (
    LANGUAGE_INSTRUCTIONS,
    PROMPT_VERSION,
    build_context,
    render_prompt,
    select_examples,
)
from app.services.llm.base import POSTS_RESPONSE_SCHEMA
from app.services.llm.mock_provider import MockProvider

_EXAMPLES_DIR = Path(__file__).resolve().parents[2] / "docs" / "examples"


def _load_fixtures() -> tuple[BrandOut, CampaignOut]:
    brand_data = json.loads((_EXAMPLES_DIR / "brand.json").read_text(encoding="utf-8"))
    campaign_data = json.loads(
        (_EXAMPLES_DIR / "campaign.json").read_text(encoding="utf-8")
    )
    return BrandOut.model_validate(brand_data), CampaignOut.model_validate(campaign_data)


def test_prompt_version():
    assert PROMPT_VERSION == "generate_v1"


def test_render_prompt_contains_expected_fields():
    brand, campaign = _load_fixtures()
    prompt = render_prompt(build_context(brand, campaign))

    assert "PLATFORMS: linkedin, instagram, x" in prompt
    assert "LANGUAGE_MODE: en" in prompt
    assert "CTA: Visit any branch this weekend" in prompt
    for phrase in brand.prohibited_phrases:
        assert phrase in prompt
    assert "$" not in prompt


def test_select_examples_limit_and_truncation():
    brand, _ = _load_fixtures()
    examples = [
        {"platform": "linkedin", "text": "A" * 1000 if i == 0 else f"Example {i}"}
        for i in range(8)
    ]
    brand_with_8 = brand.model_copy(update={"example_posts": examples})
    selected = select_examples(brand_with_8.example_posts, ["linkedin", "x"])

    assert len(selected) == 5
    assert all(len(ex.text) <= 600 for ex in selected)


def test_select_examples_prioritizes_requested_platforms():
    brand, _ = _load_fixtures()
    examples = [
        {"platform": "linkedin", "text": "LI 1"},
        {"platform": "instagram", "text": "IG 1"},
        {"platform": "x", "text": "X 1"},
        {"platform": "linkedin", "text": "LI 2"},
        {"platform": "x", "text": "X 2"},
    ]
    brand_custom = brand.model_copy(update={"example_posts": examples})
    selected = select_examples(brand_custom.example_posts, ["x"])

    assert [ex.platform for ex in selected[:2]] == ["x", "x"]
    assert [ex.text for ex in selected] == ["X 1", "X 2", "LI 1", "IG 1", "LI 2"]


@pytest.mark.parametrize("lang", ["en", "ur", "roman_ur"])
def test_language_instructions_in_prompt(lang: str):
    brand, campaign = _load_fixtures()
    prompt = render_prompt(build_context(brand, campaign, language_mode=lang))
    assert LANGUAGE_INSTRUCTIONS[lang] in prompt


def test_language_mode_override():
    brand, campaign = _load_fixtures()
    assert campaign.language_mode == "en"
    prompt = render_prompt(build_context(brand, campaign, language_mode="ur"))
    assert "LANGUAGE_MODE: ur" in prompt


def test_empty_cta_omits_cta_line():
    brand, campaign = _load_fixtures()
    campaign_no_cta = campaign.model_copy(update={"cta": ""})
    prompt = render_prompt(build_context(brand, campaign_no_cta))
    assert not any(line.startswith("CTA:") for line in prompt.splitlines())


def test_round_trip_with_mock_provider_ur():
    brand, campaign = _load_fixtures()
    prompt = render_prompt(build_context(brand, campaign, "ur"))
    raw = MockProvider().generate(prompt, POSTS_RESPONSE_SCHEMA)
    data = json.loads(raw)

    posts = data["posts"]
    assert [p["platform"] for p in posts] == ["linkedin", "instagram", "x"]
    for post in posts:
        assert re.search(r"[\u0600-\u06FF]", post["text"])
