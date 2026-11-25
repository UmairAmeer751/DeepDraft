from types import SimpleNamespace

import pytest

from app.services.llm.base import ProviderError
from app.services.llm.gemini_provider import GeminiProvider, map_exception


class _FakeModels:
    def __init__(self, response=None, exc: Exception | None = None) -> None:
        self._response = response
        self._exc = exc
        self.calls: list[dict] = []

    def generate_content(self, *, model: str, contents: str, config: dict):
        self.calls.append({"model": model, "contents": contents, "config": config})
        if self._exc is not None:
            raise self._exc
        return self._response


class _FakeClient:
    def __init__(self, response=None, exc: Exception | None = None) -> None:
        self.models = _FakeModels(response=response, exc=exc)


def test_gemini_generate_success():
    client = _FakeClient(response=SimpleNamespace(text='{"posts": []}'))
    provider = GeminiProvider("test-key", "gemini-2.5-flash", 30, client=client)
    schema = {"type": "OBJECT"}
    result = provider.generate("hello", schema)

    assert result == '{"posts": []}'
    assert len(client.models.calls) == 1
    call = client.models.calls[0]
    assert call["model"] == "gemini-2.5-flash"
    assert call["contents"] == "hello"
    assert call["config"] == {
        "response_mime_type": "application/json",
        "response_schema": schema,
    }


@pytest.mark.parametrize("raw_text", ["", "not json"])
def test_gemini_generate_invalid_response(raw_text: str):
    client = _FakeClient(response=SimpleNamespace(text=raw_text))
    provider = GeminiProvider("test-key", "gemini-2.5-flash", 30, client=client)
    with pytest.raises(ProviderError) as exc_info:
        provider.generate("hello", {"type": "OBJECT"})
    assert exc_info.value.code == "invalid_response"


def test_map_exception_codes():
    class ReadTimeout(Exception):
        pass

    class CodedError(Exception):
        def __init__(self, code: int) -> None:
            self.code = code
            super().__init__(f"err {code}")

    assert map_exception(CodedError(429)).code == "rate_limited"
    assert map_exception(CodedError(401)).code == "auth_failed"
    assert map_exception(CodedError(403)).code == "auth_failed"
    assert map_exception(CodedError(503)).code == "unavailable"
    assert map_exception(ReadTimeout("timed out")).code == "timeout"
    assert map_exception(ValueError("bad")).code == "unavailable"


def test_gemini_generate_maps_exception():
    class RateLimitErr(Exception):
        code = 429

    client = _FakeClient(exc=RateLimitErr("too many requests"))
    provider = GeminiProvider("test-key", "gemini-2.5-flash", 30, client=client)
    with pytest.raises(ProviderError) as exc_info:
        provider.generate("hello", {"type": "OBJECT"})
    assert exc_info.value.code == "rate_limited"


def test_gemini_init_validation():
    with pytest.raises(ProviderError) as exc_info:
        GeminiProvider("", "m", 30)
    assert exc_info.value.code == "auth_failed"

    with pytest.raises(ProviderError) as exc_info:
        GeminiProvider("k", "", 30)
    assert exc_info.value.code == "unavailable"
