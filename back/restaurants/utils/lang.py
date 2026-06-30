from __future__ import annotations


def normalize_lang(raw: str | None, enabled_languages: list[str] | None = None) -> str:
    """
    Normalize a raw lang string to a canonical code, then validate against
    the restaurant's enabled_languages list.

    Fallback chain:
      1. normalized code, if it's in enabled_languages
      2. first entry of enabled_languages
      3. "tr" (if enabled_languages is empty or None)
    """
    if not raw:
        normalized = "tr"
    else:
        raw = raw.lower().strip()
        if raw.startswith("en"):
            normalized = "en"
        elif raw.startswith("ru"):
            normalized = "ru"
        else:
            normalized = "tr"

    if not enabled_languages:
        return normalized

    if normalized in enabled_languages:
        return normalized

    return enabled_languages[0] if enabled_languages else "tr"


def get_lang(request, enabled_languages: list[str] | None = None, default: str = "tr") -> str:
    """
    Resolve language from request query param or Accept-Language header,
    then validate against enabled_languages.
    """
    q = (request.query_params.get("lang") or "").strip().lower()
    if q:
        return normalize_lang(q, enabled_languages)

    header = (request.headers.get("Accept-Language") or "").lower()
    for part in header.split(","):
        code = part.strip().split(";")[0].split("-")[0]
        if code in ("tr", "en", "ru"):
            return normalize_lang(code, enabled_languages)

    return normalize_lang(default, enabled_languages)
