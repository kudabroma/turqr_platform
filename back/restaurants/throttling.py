# throttling.py
from rest_framework.throttling import AnonRateThrottle


def get_client_ip(request) -> str:
    """
    Реальный IP клиента за прокси (Cloudflare -> Railway edge -> gunicorn).

    REMOTE_ADDR за такой цепочкой — это IP ближайшего прокси, а не клиента,
    поэтому все посетители из-за одного прокси-хопа делили бы один throttle-бакет.
    Приоритет: CF-Connecting-IP (Cloudflare переписывает этот заголовок на
    своём edge, клиент не может его подделать, если домен проксируется через
    Cloudflare) -> первый адрес в X-Forwarded-For -> REMOTE_ADDR как fallback.
    """
    cf_ip = request.META.get("HTTP_CF_CONNECTING_IP")
    if cf_ip:
        return cf_ip.strip()

    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()

    return request.META.get("REMOTE_ADDR", "")


class ClientIPAnonRateThrottle(AnonRateThrottle):
    """AnonRateThrottle, считающий лимит по реальному IP клиента, а не по IP прокси."""

    def get_ident(self, request):
        return get_client_ip(request)
