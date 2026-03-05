import requests
from django.conf import settings

from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import AllowAny
from rest_framework.parsers import JSONParser, FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework import status


@api_view(["POST"])
@permission_classes([AllowAny])
@parser_classes([JSONParser, FormParser, MultiPartParser])
def create_lead(request):
    # request.data будет работать и для JSON, и для form-data
    name = (request.data.get("name") or "").strip()
    restaurant = (request.data.get("restaurant") or "").strip()
    city = (request.data.get("city") or "").strip()
    phone = (request.data.get("phone") or "").strip()

    # минимальная валидация
    if not phone:
        return Response(
            {"detail": "phone is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_CHAT_ID:
        return Response(
            {"detail": "Telegram env is not configured (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID)"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    message = (
        "🚀 New TurQR Lead\n\n"
        f"Name: {name or '-'}\n"
        f"Restaurant: {restaurant or '-'}\n"
        f"City: {city or '-'}\n"
        f"Phone: {phone}\n"
    )

    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    r = requests.post(url, json={"chat_id": settings.TELEGRAM_CHAT_ID, "text": message}, timeout=10)

    if r.status_code != 200:
        return Response(
            {"detail": "Telegram send failed", "telegram_status": r.status_code, "telegram_response": r.text},
            status=status.HTTP_502_BAD_GATEWAY
        )

    return Response({"success": True})