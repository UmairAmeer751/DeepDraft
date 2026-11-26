import copy
import json
from pathlib import Path

import pytest

from app.services.export_service import (
    EXPERIMENTAL_SCORE_LINE,
    NO_RUN_LINE,
    build_json,
    build_md,
    build_txt,
    content_type,
    export_filename,
)

EXAMPLES_DIR = Path(__file__).resolve().parents[2] / "docs" / "examples"


def _load_example(filename: str) -> dict:
    return json.loads((EXAMPLES_DIR / filename).read_text(encoding="utf-8"))


def test_all_formats_include_every_post() -> None:
    campaign = _load_example("campaign.json")
    run = _load_example("generation_run.json")
    brand_name = campaign["brand_name"]

    txt_out = build_txt(campaign, brand_name, run)
    md_out = build_md(campaign, brand_name, run)
    json_out = build_json(campaign, brand_name, run)
    parsed_json = json.loads(json_out)

    for post in run["posts"]:
        assert post["platform"] in txt_out
        assert post["text"] in txt_out
        for tag in post["hashtags"]:
            assert tag in txt_out

        assert post["platform"] in md_out
        assert post["text"] in md_out
        for tag in post["hashtags"]:
            assert tag in md_out
        assert str(post["score"]["total"]) in md_out

    assert parsed_json["brand_name"] == brand_name
    assert parsed_json["run"] == run
    assert "latest_run" not in parsed_json["campaign"]
    assert "runs" not in parsed_json["campaign"]


def test_urdu_text_survives_utf8_roundtrip_in_all_formats() -> None:
    campaign = _load_example("campaign.json")
    ur_run = _load_example("generation_run_ur.json")
    brand_name = campaign["brand_name"]

    for builder in (build_txt, build_md, build_json):
        output = builder(campaign, brand_name, ur_run)
        roundtripped = output.encode("utf-8").decode("utf-8")
        assert roundtripped == output
        for post in ur_run["posts"]:
            assert post["text"] in roundtripped


def test_edited_post_text_appears_in_all_formats() -> None:
    campaign = copy.deepcopy(_load_example("campaign.json"))
    run = copy.deepcopy(_load_example("generation_run.json"))
    edited_text = "Updated copy for LinkedIn after review."
    run["posts"][0]["text"] = edited_text
    run["posts"][0]["edited"] = True

    txt_out = build_txt(campaign, campaign["brand_name"], run)
    md_out = build_md(campaign, campaign["brand_name"], run)
    json_out = build_json(campaign, campaign["brand_name"], run)

    assert edited_text in txt_out
    assert edited_text in md_out
    assert edited_text in json_out
    assert json.loads(json_out)["run"]["posts"][0]["text"] == edited_text


def test_md_contains_experimental_score_line() -> None:
    campaign = _load_example("campaign.json")
    md_out = build_md(campaign, campaign["brand_name"], campaign["latest_run"])
    assert EXPERIMENTAL_SCORE_LINE in md_out
    assert md_out.splitlines()[-1] == EXPERIMENTAL_SCORE_LINE


def test_no_run_yet_campaign_handled_cleanly() -> None:
    campaign = copy.deepcopy(_load_example("campaign.json"))
    campaign["latest_run"] = None
    brand_name = campaign["brand_name"]

    txt_out = build_txt(campaign, brand_name, None)
    md_out = build_md(campaign, brand_name, None)
    json_out = build_json(campaign, brand_name, None)

    assert NO_RUN_LINE in txt_out
    assert brand_name in txt_out
    assert NO_RUN_LINE in md_out
    assert brand_name in md_out
    parsed = json.loads(json_out)
    assert parsed["run"] is None
    assert parsed["brand_name"] == brand_name
    assert "latest_run" not in parsed["campaign"]
    assert "runs" not in parsed["campaign"]


def test_filename_content_type_and_unknown_format() -> None:
    assert export_filename(3, "txt") == "deepdraft_campaign_3.txt"
    assert export_filename(3, "md") == "deepdraft_campaign_3.md"
    assert export_filename(3, "json") == "deepdraft_campaign_3.json"

    assert content_type("txt") == "text/plain; charset=utf-8"
    assert content_type("md") == "text/markdown; charset=utf-8"
    assert content_type("json") == "application/json; charset=utf-8"

    with pytest.raises(ValueError):
        export_filename(3, "pdf")
    with pytest.raises(ValueError):
        content_type("csv")
