import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.core.config import settings
from app.services.llm.base import POSTS_RESPONSE_SCHEMA, ProviderError
from app.services.llm.gemini_provider import GeminiProvider


def main() -> None:
    try:
        provider = GeminiProvider(
            settings.LLM_API_KEY,
            settings.LLM_MODEL,
            settings.LLM_TIMEOUT_SECONDS,
        )
        prompts = [
            (
                "Create social media posts for a fictional cafe 'Chai Junction (fictional demo)' "
                "promoting its winter menu for platforms: linkedin, instagram, x. "
                "Write in English."
            ),
            (
                "Create social media posts for a fictional cafe 'Chai Junction (fictional demo)' "
                "promoting its winter menu for platforms: linkedin, instagram, x. "
                "Write in Urdu using Urdu script."
            ),
        ]
        for prompt in prompts:
            start = time.perf_counter()
            text = provider.generate(prompt, POSTS_RESPONSE_SCHEMA)
            latency_ms = (time.perf_counter() - start) * 1000
            print(f"Latency: {latency_ms:.1f} ms")
            print(json.dumps(json.loads(text), ensure_ascii=False, indent=2))
    except ProviderError as exc:
        print(f"ProviderError [{exc.code}]: {exc.message}")
        sys.exit(1)


if __name__ == "__main__":
    main()
