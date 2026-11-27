import json
from typing import Any

EXPERIMENTAL_SCORE_LINE = "Score is experimental - DeepDraft FYP-1"
NO_RUN_LINE = "No generation run yet."

_FORMAT_META: dict[str, tuple[str, str]] = {
    "txt": ("txt", "text/plain; charset=utf-8"),
    "md": ("md", "text/markdown; charset=utf-8"),
    "json": ("json", "application/json; charset=utf-8"),
}


def _normalize_format(fmt: str) -> str:
    normalized = fmt.lower().strip()
    if normalized not in _FORMAT_META:
        raise ValueError(f"Unsupported export format: {fmt!r}")
    return normalized


def _resolve_inputs(
    campaign: dict[str, Any],
    brand_name: str | None,
    latest_run: dict[str, Any] | None,
) -> tuple[str, dict[str, Any] | None]:
    resolved_brand = brand_name if brand_name is not None else str(campaign.get("brand_name", ""))
    resolved_run = latest_run if latest_run is not None else campaign.get("latest_run")
    return resolved_brand, resolved_run


def export_filename(campaign_id: int | str, fmt: str) -> str:
    """Return the download filename for a campaign export."""
    ext, _ = _FORMAT_META[_normalize_format(fmt)]
    return f"deepdraft_campaign_{campaign_id}.{ext}"


def content_type(fmt: str) -> str:
    """Return the HTTP Content-Type header value for an export format."""
    _, media_type = _FORMAT_META[_normalize_format(fmt)]
    return media_type


def build_txt(
    campaign: dict[str, Any],
    brand_name: str | None = None,
    latest_run: dict[str, Any] | None = None,
) -> str:
    """Format a campaign and its latest generation run as plain text."""
    resolved_brand, resolved_run = _resolve_inputs(campaign, brand_name, latest_run)
    topic = str(campaign.get("topic", ""))
    lines: list[str] = [f"Brand: {resolved_brand}", f"Campaign: {topic}"]

    if resolved_run is None:
        lines.append("")
        lines.append(NO_RUN_LINE)
        return "\n".join(lines)

    for post in resolved_run.get("posts", []):
        platform = str(post.get("platform", ""))
        text = str(post.get("text", ""))
        hashtags = " ".join(str(tag) for tag in post.get("hashtags", []))
        lines.append("")
        lines.append(f"[{platform}]")
        lines.append(text)
        if hashtags:
            lines.append(hashtags)

    return "\n".join(lines)


def build_md(
    campaign: dict[str, Any],
    brand_name: str | None = None,
    latest_run: dict[str, Any] | None = None,
) -> str:
    """Format a campaign and its latest generation run as Markdown."""
    resolved_brand, resolved_run = _resolve_inputs(campaign, brand_name, latest_run)
    topic = str(campaign.get("topic", ""))
    lines: list[str] = [f"# {topic}", f"**Brand:** {resolved_brand}"]

    if resolved_run is None:
        lines.append("")
        lines.append(NO_RUN_LINE)
        return "\n".join(lines)

    for post in resolved_run.get("posts", []):
        platform = str(post.get("platform", ""))
        text = str(post.get("text", ""))
        hashtags = " ".join(str(tag) for tag in post.get("hashtags", []))
        score = post.get("score")
        score_total = score.get("total") if isinstance(score, dict) else None
        score_str = f"{score_total}" if score_total is not None else "N/A"

        lines.append("")
        lines.append(f"## {platform}")
        lines.append("")
        lines.append(text)
        if hashtags:
            lines.append("")
            lines.append(hashtags)
        lines.append("")
        lines.append(f"**Score:** {score_str}")

    lines.append("")
    lines.append(EXPERIMENTAL_SCORE_LINE)
    return "\n".join(lines)


def build_json(
    campaign: dict[str, Any],
    brand_name: str | None = None,
    latest_run: dict[str, Any] | None = None,
) -> str:
    """Format a campaign, its brand name, and its latest run as UTF-8 JSON."""
    resolved_brand, resolved_run = _resolve_inputs(campaign, brand_name, latest_run)
    campaign_copy = {
        k: v for k, v in campaign.items() if k not in ("latest_run", "runs")
    }
    payload = {
        "campaign": campaign_copy,
        "brand_name": resolved_brand,
        "run": resolved_run,
    }
    return json.dumps(payload, ensure_ascii=False, indent=2)
