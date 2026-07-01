from __future__ import annotations

import json
import logging
import os
import re

import anthropic

logger = logging.getLogger(__name__)

MODEL = "claude-haiku-4-5-20251001"

_SYSTEM_PROMPT = (
    "You are a culinary translator for restaurant menus. Use culinary "
    "judgement for dish names, not literal machine translation. Every dish "
    "name falls into one of three categories:\n"
    "\n"
    "1. Fully descriptive name — the whole name just describes the dish by "
    "its ingredients or type (a soup, a salad, a dessert), with no "
    "traditional or branded identity. Translate the whole name naturally.\n"
    "Example: \"Mercimek Çorbası\" -> RU \"Чечевичный суп\", EN \"Lentil "
    "Soup\"; \"Mevsim Salatası\" -> RU \"Сезонный салат\", EN \"Seasonal "
    "Salad\".\n"
    "\n"
    "2. Compound name — a descriptive modifier (an ingredient or "
    "preparation style, e.g. \"peynirli\" = with cheese, \"tavuk\" = "
    "chicken, \"acılı\" = spicy) combined with a traditional/branded base "
    "name (e.g. börek, şiş, köfte, kebap, mantı). Translate the modifier "
    "naturally into the target language, but keep the base name in Turkish "
    "(transliterated, not translated). NEVER drop the modifier — "
    "translating only the base and discarding the modifier is wrong.\n"
    "Example: \"Peynirli Börek\" -> EN \"Cheese Börek\", RU \"Бёрек с "
    "сыром\" (NOT just \"Börek\"); \"Tavuk Şiş\" -> EN \"Chicken Shish\", RU "
    "\"Куриный шиш\" (NOT just \"Şiş\"); \"Acılı Köfte\" -> EN \"Spicy "
    "Köfte\", RU \"Острые кёфте\".\n"
    "\n"
    "3. Established compound identity — the full name together is a single "
    "proper/geographic or branded dish name with no separable descriptive "
    "part (e.g. \"Adana Kebap\", \"İskender Kebap\"). Keep the entire name "
    "in Turkish, unchanged, for every language.\n"
    "\n"
    "If you're unsure whether a name is category 2 or 3, ask: does removing "
    "the first word still leave a real, generic dish name (e.g. \"Kebap\" "
    "alone is generic → category 2), or does the name only mean something "
    "as a whole, tied to a specific place or person (e.g. \"Adana\", "
    "\"İskender\" → category 3)? If in doubt, prefer category 2 and "
    "translate the modifier — losing an ingredient/style word is a bigger "
    "error than an unnecessary translation.\n"
    "\n"
    "If a literal translation would sound awkward or lose the dish's "
    "identity in any category, keep the traditional part in Turkish. Never "
    "produce a machine-translation-sounding name.\n"
    "\n"
    "Always translate the description naturally and accurately.\n"
    "Return valid JSON only, with both \"name\" and \"description\" for "
    "every requested language."
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
    example = ", ".join(
        f'"{lang}": {{"name": "...", "description": "..."}}' for lang in target_langs
    )
    return (
        f"Turkish dish name: {name_tr!r}\n"
        f"Turkish description: {description_tr!r}\n\n"
        f"Provide the dish name and description for these languages: {langs_str}.\n"
        "Return strictly JSON, with no text before or after it, in this exact shape:\n"
        f"{{{example}}}\n"
        "Apply culinary judgement to the name as instructed."
    )


def translate_dish_description(
    name_tr: str,
    description_tr: str,
    target_langs: list[str],
) -> dict[str, dict[str, str]]:
    """
    Translate a Turkish dish name and description into the given target languages
    via Claude Haiku. The model uses culinary judgement on the name — a plain
    descriptive name is translated, an established Turkish dish name is kept as-is.
    Returns {"<lang>": {"name": "...", "description": "..."}, ...}.
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
        if not isinstance(entry, dict) or not isinstance(entry.get("description"), str):
            continue

        name = entry.get("name")
        if not isinstance(name, str) or not name.strip():
            # Model omitted the name or returned something unusable — keep the
            # original Turkish name rather than losing it.
            name = name_tr

        result[lang] = {
            "name": name.strip(),
            "description": entry["description"].strip(),
        }

    if not result:
        raise TranslationError("Сервис перевода не вернул переводов для запрошенных языков.")

    return result
