def normalize_lang(raw: str | None) -> str:
    """
    Нормализует язык из query param.
    По умолчанию возвращает 'tr'.
    Поддержка: ?lang=en
    """
    if not raw:
        return "tr"

    raw = raw.lower().strip()

    if raw.startswith("en"):
        return "en"

    return "tr"
def get_lang(request, default: str = "tr") -> str:
    q = (request.query_params.get("lang") or "").strip().lower()
    if q in ("tr", "en", "ru"):
        return q

    header = (request.headers.get("Accept-Language") or "").lower()
    for part in header.split(","):
        code = part.strip().split(";")[0].split("-")[0]
        if code in ("tr", "en", "ru"):
            return code

    return default