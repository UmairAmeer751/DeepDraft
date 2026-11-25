import pytest

from app.core.config import settings
from app.services.llm.base import ProviderError
from app.services.llm.factory import get_provider
from app.services.llm.mock_provider import MockProvider


def test_get_provider_mock():
    provider = get_provider("mock")
    assert isinstance(provider, MockProvider)


def test_get_provider_gemini_auth_failed(monkeypatch):
    monkeypatch.setattr(settings, "LLM_API_KEY", "")
    with pytest.raises(ProviderError) as exc_info:
        get_provider("gemini")
    assert exc_info.value.code == "auth_failed"


def test_get_provider_other():
    with pytest.raises(ValueError):
        get_provider("other")
