class RestaurantSubdomainMiddleware:
    """
    Extract restaurant slug from subdomain.

    Examples:
    - turko.restoran.com      -> slug = "turko"
    - www.restoran.com        -> slug = None
    - restoran.com            -> slug = None
    - localhost / 127.0.0.1   -> slug = None
    """
    RESERVED_SUBDOMAINS = {"www", "api", "admin"}

    # ✅ домены, где мы реально поддерживаем subdomain-режим
    # (ngrok сюда не входит специально)
    SUBDOMAIN_ROOTS = {"localhost", "turqr.com"}

    # ✅ домены, которые нельзя трактовать как прод-субдомены
    BLOCKED_SUFFIXES = {
        "ngrok-free.dev",
        "ngrok.io",
        "ngrok.app",
    }

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        host = request.get_host().split(":")[0].lower()  # ✅ lower для надёжности
        parts = host.split(".")

        slug = None

        # ✅ 0) Явно исключаем ngrok (иначе parts>=3 и slug становится рандомным)
        for sfx in self.BLOCKED_SUFFIXES:
            if host == sfx or host.endswith("." + sfx):
                request.restaurant_slug = None
                return self.get_response(request)

        # 1) DEV: *.localhost (2 части)
        if len(parts) == 2 and parts[1] == "localhost":
            candidate = parts[0]
            if candidate not in self.RESERVED_SUBDOMAINS:
                slug = candidate

        # 2) PROD: <slug>.<domain>.<tld> (3+ части)
        elif len(parts) >= 3:
            candidate = parts[0]
            root = ".".join(parts[-2:])  # ✅ домен+тлд, например turqr.com

            # ✅ субдомены разрешаем только для наших доменов
            if root in self.SUBDOMAIN_ROOTS and candidate not in self.RESERVED_SUBDOMAINS:
                slug = candidate

        # 3) Иначе: localhost / IP / странные домены -> None

        request.restaurant_slug = slug
        return self.get_response(request)