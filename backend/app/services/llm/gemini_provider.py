import json

from app.services.llm.base import ProviderError


def map_exception(exc: Exception) -> ProviderError:
    """Map an arbitrary SDK or HTTP exception to a normalized ProviderError."""
    if "Timeout" in type(exc).__name__:
        return ProviderError("timeout", f"Gemini error timeout: {str(exc)[:200]}")

    raw_code = getattr(exc, "code", None)
    if raw_code == 429:
        mapped = "rate_limited"
    elif raw_code in (401, 403):
        mapped = "auth_failed"
    elif raw_code == 400:
        mapped = "invalid_response"
    elif isinstance(raw_code, int) and 500 <= raw_code <= 599:
        mapped = "unavailable"
    else:
        mapped = "unavailable"

    return ProviderError(mapped, f"Gemini error {mapped}: {str(exc)[:200]}")


class GeminiProvider:
    """LLM provider backed by the Google GenAI SDK."""

    name = "gemini"

    def __init__(
        self,
        api_key: str,
        model: str,
        timeout_seconds: int,
        client=None,
    ) -> None:
        if not api_key:
            raise ProviderError("auth_failed", "LLM_API_KEY is not set")
        if not model:
            raise ProviderError("unavailable", "LLM_MODEL is not set")
        self.model = model
        if client is None:
            from google import genai
            from google.genai import types

            client = genai.Client(
                api_key=api_key,
                http_options=types.HttpOptions(timeout=timeout_seconds * 1000),
            )
        self.client = client

    def generate(self, prompt: str, response_schema: dict) -> str:
        """Generate raw JSON text from Gemini matching the given response schema."""
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "response_schema": response_schema,
                },
            )
            text = getattr(response, "text", None)
            if not text:
                raise ProviderError("invalid_response", "Empty response from Gemini")
            try:
                json.loads(text)
            except json.JSONDecodeError as exc:
                raise ProviderError(
                    "invalid_response",
                    f"Invalid JSON from Gemini: {str(exc)[:200]}",
                ) from exc
            return text
        except ProviderError:
            raise
        except Exception as exc:
            raise map_exception(exc) from exc
