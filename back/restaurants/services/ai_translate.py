from __future__ import annotations

import json
import logging
import os
import re

import anthropic

logger = logging.getLogger(__name__)

MODEL = "claude-haiku-4-5-20251001"

_SYSTEM_PROMPT = (
    "You translate restaurant menu descriptions. NEVER translate dish names — "
    "keep them exactly as the original Turkish. Only translate the description text. "
    "Return valid JSON."
)

_JSON_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.IGNORECASE | re.MULTILINE)


class TranslationError(Exception):
    """Raised when AI translation cannot be completed. Message is safe to show to the user."""


def _get_client() -> anthropic.Anthropic:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise TranslationError("ANTHROPIC_API_KEY не настроен на сервере.")
    return anthropic.Anthropic(api_key=api_key)


def _build_user_prompt(name_tr: str, description_tr: str, target_langs: list[str]) -> str:
    langs_str = ", ".join(target_langs)
    example = ", ".join(f'"{lang}": {{"description": "..."}}' for lang in target_langs)
    return (
        f"Turkish dish name (do NOT translate, keep exactly as-is): {name_tr!r}\n"
        f"Turkish description to translate: {description_tr!r}\n\n"
        f"Translate the description into these languages: {langs_str}.\n"
        "Return strictly JSON, with no text before or after it, in this exact shape:\n"
        f"{{{example}}}\n"
        "Use one object per requested language code. Do not include the dish name in the output."
    )


def translate_dish_description(
    name_tr: str,
    description_tr: str,
    target_langs: list[str],
) -> dict[str, dict[str, str]]:
    """
    Translate a Turkish dish description into the given target languages via Claude Haiku.
    Dish names are never translated. Returns {"<lang>": {"description": "..."}, ...}.
    Raises TranslationError with a user-safe message on any failure.
    """
    if not target_langs:
        raise TranslationError("Не указаны целевые языки для перевода.")

    if not (description_tr or "").strip():
        raise TranslationError("Нет турецкого описания для перевода.")

    client = _get_client()

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=2048,
            system=_SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": _build_user_prompt(name_tr, description_tr, target_langs),
                }
            ],
        )
    except anthropic.AuthenticationError as exc:
        logger.error("Anthropic auth error: %s", exc)
        raise TranslationError("Неверный ANTHROPIC_API_KEY.") from exc
    except anthropic.RateLimitError as exc:
        logger.warning("Anthropic rate limit: %s", exc)
        raise TranslationError("Сервис перевода перегружен, попробуйте позже.") from exc
    except anthropic.APIConnectionError as exc:
        logger.error("Anthropic connection error: %s", exc)
        raise TranslationError("Не удалось подключиться к сервису перевода.") from exc
    except anthropic.APIStatusError as exc:
        logger.error("Anthropic API error: %s", exc)
        raise TranslationError("Ошибка сервиса перевода.") from exc

    text = "".join(
        block.text for block in response.content if getattr(block, "type", None) == "text"
    ).strip()

    if not text:
        raise TranslationError("Пустой ответ от сервиса перевода.")

    text = _JSON_FENCE_RE.sub("", text).strip()

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError as exc:
        logger.error("Anthropic returned non-JSON: %s", text[:500])
        raise TranslationError("Сервис перевода вернул некорректный формат.") from exc

    if not isinstance(parsed, dict):
        raise TranslationError("Сервис перевода вернул некорректный формат.")

    result: dict[str, dict[str, str]] = {}
    for lang in target_langs:
        entry = parsed.get(lang)
        if isinstance(entry, dict) and isinstance(entry.get("description"), str):
            result[lang] = {"description": entry["description"].strip()}

    if not result:
        raise TranslationError("Сервис перевода не вернул переводов для запрошенных языков.")

    return result
