import json
import re

from app.services.llm.base import ERROR_CODES, ProviderError

_DEFAULT_PLATFORMS = ("linkedin", "instagram", "x")

_PLATFORMS_RE = re.compile(r"^\s*PLATFORMS:\s*(.+?)\s*$", re.IGNORECASE | re.MULTILINE)
_LANGUAGE_RE = re.compile(
    r"^\s*LANGUAGE_MODE:\s*(en|ur|roman_ur)\s*$", re.IGNORECASE | re.MULTILINE
)
_CTA_RE = re.compile(r"^\s*CTA:\s*(.+?)\s*$", re.IGNORECASE | re.MULTILINE)

_SAMPLES: dict[tuple[str, str], tuple[str, list[str]]] = {
    ("linkedin", "en"): (
        "Warm up your workday with our new Winter Menu at Chai Junction! "
        "We are serving slow-simmered Kashmiri chai, spiced cardamom lattes, "
        "and freshly baked walnut brownies crafted for crisp mornings.",
        ["#WinterMenu", "#CafeSpecials", "#WarmDrinks"],
    ),
    ("instagram", "en"): (
        "Cozy season has arrived at Chai Junction! "
        "Sip on velvety cinnamon hot chocolate, roasted hazelnut espresso, "
        "and steaming saffron chai paired with warm butter croissants.",
        ["#WinterMenu", "#CozyCafe", "#ChaiTime", "#SeasonalSips"],
    ),
    ("x", "en"): (
        "Our Winter Menu is here! Try spiced Kashmiri chai, cinnamon hot cocoa, "
        "and warm brownies all season long.",
        ["#WinterMenu", "#ChaiCafe"],
    ),
    ("linkedin", "ur"): (
        "سردیوں کی آمد کے ساتھ ہمارے کیفے کا نیا ونٹر مینیو پیش خدمت ہے۔ "
        "گرم کشمیری چائے، الائچی کافی اور تازہ اخروٹ براؤنی کے ساتھ "
        "اپنے دن کا خوشگوار آغاز کریں۔",
        ["#WinterMenu", "#CafeSpecials", "#WarmDrinks"],
    ),
    ("instagram", "ur"): (
        "سرد موسم اور گرم مشروبات کا بہترین جوڑ! "
        "ہمارے کیفے میں دارچینی ہاٹ چاکلیٹ، زعفرانی چائے اور گرما گرم کیک "
        "کا لطف اٹھائیں۔",
        ["#WinterMenu", "#CozyCafe", "#ChaiTime", "#SeasonalSips"],
    ),
    ("x", "ur"): (
        "ہمارا نیا ونٹر مینیو آ گیا ہے! گرم کشمیری چائے اور ہاٹ چاکلیٹ کا مزہ لیں۔",
        ["#WinterMenu", "#ChaiCafe"],
    ),
    ("linkedin", "roman_ur"): (
        "Sardiyon ke liye hamare cafe ka naya Winter Menu tayyar hai! "
        "Garam Kashmiri chai, elaichi latte aur fresh walnut brownies ke saath "
        "apne workday ko cozy banayein.",
        ["#WinterMenu", "#CafeSpecials", "#WarmDrinks"],
    ),
    ("instagram", "roman_ur"): (
        "Thand ka mausam aur garam chai ka maza! "
        "Chai Junction par cinnamon hot chocolate, zafrani chai aur warm croissants "
        "aap ka intezar kar rahe hain.",
        ["#WinterMenu", "#CozyCafe", "#ChaiTime", "#SeasonalSips"],
    ),
    ("x", "roman_ur"): (
        "Hamara Winter Menu aa gaya hai! Garam Kashmiri chai aur hot cocoa try karein.",
        ["#WinterMenu", "#ChaiCafe"],
    ),
}


class MockProvider:
    """Deterministic offline LLM provider for testing and local development."""

    name = "mock"
    model = "mock-v1"

    def __init__(self, fail_mode: str = "") -> None:
        self.fail_mode = fail_mode

    def generate(self, prompt: str, response_schema: dict) -> str:
        """Return deterministic JSON posts or simulate configured failure modes."""
        if self.fail_mode == "invalid_response":
            return "not valid json"
        if self.fail_mode in ERROR_CODES:
            raise ProviderError(
                self.fail_mode,
                f"Simulated {self.fail_mode} from MockProvider",
            )
        if self.fail_mode:
            raise ValueError(f"Unsupported fail_mode: {self.fail_mode!r}")

        platforms = _parse_platforms(prompt)
        language_mode = _parse_language_mode(prompt)
        cta = _parse_cta(prompt)

        posts = []
        for platform in platforms:
            base_text, hashtags = _SAMPLES[(platform, language_mode)]
            text = f"{base_text} {cta}" if cta else base_text
            posts.append(
                {
                    "platform": platform,
                    "text": text,
                    "hashtags": list(hashtags),
                }
            )

        return json.dumps({"posts": posts}, ensure_ascii=False)


def _parse_platforms(prompt: str) -> list[str]:
    match = _PLATFORMS_RE.search(prompt)
    if not match:
        return list(_DEFAULT_PLATFORMS)
    parsed = [p.strip().lower() for p in match.group(1).split(",") if p.strip()]
    return parsed or list(_DEFAULT_PLATFORMS)


def _parse_language_mode(prompt: str) -> str:
    match = _LANGUAGE_RE.search(prompt)
    if not match:
        return "en"
    return match.group(1).lower()


def _parse_cta(prompt: str) -> str:
    match = _CTA_RE.search(prompt)
    if not match:
        return ""
    return match.group(1).strip()
