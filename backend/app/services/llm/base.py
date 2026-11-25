from typing import Protocol

ERROR_CODES = (
    "timeout",
    "rate_limited",
    "auth_failed",
    "invalid_response",
    "unavailable",
)

POSTS_RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "posts": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "platform": {
                        "type": "STRING",
                        "enum": ["linkedin", "instagram", "x"],
                    },
                    "text": {"type": "STRING"},
                    "hashtags": {
                        "type": "ARRAY",
                        "items": {"type": "STRING"},
                    },
                },
                "required": ["platform", "text", "hashtags"],
            },
        }
    },
    "required": ["posts"],
}


class ProviderError(Exception):
    """Error raised by an LLM provider with a normalized error code."""

    def __init__(self, code: str, message: str) -> None:
        if code not in ERROR_CODES:
            raise ValueError(f"Invalid error code: {code!r}")
        self.code = code
        self.message = message
        super().__init__(message)


class LLMProvider(Protocol):
    """Protocol for text-generation LLM providers."""

    name: str
    model: str

    def generate(self, prompt: str, response_schema: dict) -> str:
        """Generate raw JSON text matching the given response schema."""
        ...
