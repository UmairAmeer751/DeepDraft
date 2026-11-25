from app.core.config import settings
from app.services.llm.base import LLMProvider
from app.services.llm.gemini_provider import GeminiProvider
from app.services.llm.mock_provider import MockProvider


def get_provider(
    provider: str | None = None,
    fail_mode: str | None = None,
) -> LLMProvider:
    """Return an LLMProvider instance for the configured or requested provider."""
    selected_provider = settings.LLM_PROVIDER if provider is None else provider
    selected_fail_mode = settings.MOCK_FAIL if fail_mode is None else fail_mode

    if selected_provider == "mock":
        return MockProvider(fail_mode=selected_fail_mode or "")
    if selected_provider == "gemini":
        return GeminiProvider(
            settings.LLM_API_KEY,
            settings.LLM_MODEL,
            settings.LLM_TIMEOUT_SECONDS,
        )
    raise ValueError(f"Unsupported LLM provider: {selected_provider!r}")
