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

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        host = request.get_host().split(":")[0]  # убираем порт
        parts = host.split(".")

        slug = None

        # ожидаем минимум: <slug>.<domain>.<tld>
        # 1) DEV: *.localhost (2 части)
        if len(parts) == 2 and parts[1] == "localhost":
            candidate = parts[0]
            if candidate not in self.RESERVED_SUBDOMAINS:
                slug = candidate

        # 2) PROD: <slug>.<domain>.<tld> (3+ части)
        elif len(parts) >= 3:
            candidate = parts[0]
            if candidate not in self.RESERVED_SUBDOMAINS:
                slug = candidate

        # 3) Иначе: localhost / IP / странные домены -> None

        request.restaurant_slug = slug
        return self.get_response(request)