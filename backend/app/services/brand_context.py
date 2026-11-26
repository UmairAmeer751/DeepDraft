import string
from pathlib import Path
from types import SimpleNamespace

from app.services.format_rules import describe_rules

PROMPT_VERSION = "generate_v1"
MAX_EXAMPLES = 5
MAX_EXAMPLE_CHARS = 600

LANGUAGE_INSTRUCTIONS = {
    "en": "Write in English.",
    "ur": "Write in Urdu using Urdu (Arabic) script. Use Latin letters only for brand names and hashtags.",
    "roman_ur": (
        "Write in Roman Urdu (Urdu in Latin letters) with natural English code-mixing, "
        "the way Pakistani brands post online. Do not use Urdu script."
    ),
}


def _field(item, name, default=""):
    return item.get(name, default) if isinstance(item, dict) else getattr(item, name, default)


def select_examples(example_posts: list, platforms: list[str]) -> list:
    """Select up to MAX_EXAMPLES examples, prioritizing requested platforms in order."""
    platform_set = set(platforms)
    prioritized: list = []
    for platform in platforms:
        prioritized.extend(
            ex for ex in example_posts if _field(ex, "platform") == platform
        )
    rest = [ex for ex in example_posts if _field(ex, "platform") not in platform_set]

    selected = (prioritized + rest)[:MAX_EXAMPLES]
    return [
        SimpleNamespace(
            platform=_field(ex, "platform"),
            text=_field(ex, "text")[:MAX_EXAMPLE_CHARS],
        )
        for ex in selected
    ]


def build_context(brand, campaign, language_mode: str | None = None) -> dict:
    """Build template context dictionary from brand and campaign objects."""
    lang = language_mode if language_mode is not None else campaign.language_mode
    selected_examples = select_examples(brand.example_posts, campaign.platforms)

    prohibited_text = (
        "\n".join(f"- {phrase}" for phrase in brand.prohibited_phrases)
        if brand.prohibited_phrases
        else "None"
    )
    examples_text = (
        "\n\n".join(
            f"[{_field(ex, 'platform')}] {_field(ex, 'text')}"
            for ex in selected_examples
        )
        if selected_examples
        else "No examples provided."
    )

    return {
        "brand_name": brand.name,
        "industry": brand.industry,
        "audience": brand.audience,
        "tone": ", ".join(brand.tone) if brand.tone else "not specified",
        "guidelines": brand.guidelines or "None",
        "prohibited": prohibited_text,
        "examples": examples_text,
        "topic": campaign.topic,
        "objective": campaign.objective,
        "brief_audience": campaign.audience or "not specified",
        "key_message": campaign.key_message,
        "cta": campaign.cta or "",
        "platforms": ", ".join(campaign.platforms),
        "language_mode": lang,
        "language_instruction": LANGUAGE_INSTRUCTIONS[lang],
        "platform_rules": "\n".join(describe_rules(p) for p in campaign.platforms),
    }


def render_prompt(context: dict) -> str:
    """Load the prompt template and substitute context placeholders."""
    template_path = (
        Path(__file__).resolve().parents[1] / "prompts" / f"{PROMPT_VERSION}.md"
    )
    template_text = template_path.read_text(encoding="utf-8")
    rendered = string.Template(template_text).substitute(context)
    if not context.get("cta"):
        rendered = "\n".join(
            line for line in rendered.splitlines() if line != "CTA: "
        )
    return rendered
