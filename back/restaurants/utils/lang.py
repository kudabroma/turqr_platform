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