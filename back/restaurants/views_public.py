from __future__ import annotations

from django.conf import settings
from django.db.models import Prefetch
from django.http import Http404
from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions

from .models import Restaurant, Category, Dish
from .serializers_public import PublicRestaurantSerializer, PublicCategorySerializer
from .utils.lang import normalize_lang


# ✅ В DEV можно разрешать публичный доступ даже без активной подписки
# (чтобы ты мог тестить меню локально).
ALLOW_PUBLIC_IN_DEBUG = True


def restaurant_is_active(restaurant: Restaurant) -> tuple[bool, str | None]:
    """
    Единая точка правды: активность ресторана через подписку.

    Возвращает:
      (True, None) если ресторан можно показывать публично
      (False, reason) если нельзя (например: "inactive")
    """
    sub = getattr(restaurant, "subscription", None)

    # Нет подписки
    if not sub:
        if settings.DEBUG and ALLOW_PUBLIC_IN_DEBUG:
            return True, None
        return False, "no_subscription"

    # Есть подписка, проверяем активность
    try:
        active = bool(sub.is_active())
    except Exception:
        active = False

    if active:
        return True, None

    if settings.DEBUG and ALLOW_PUBLIC_IN_DEBUG:
        return True, None

    return False, "inactive"


def get_public_restaurant_or_404(request, slug_from_url: str | None):
    """
    Возвращает ресторан для публичного доступа:
    1) slug из subdomain middleware
    2) fallback из URL
    3) если ресторан отключён (active=False) -> 404
    4) если подписка не активна -> 404
    """

    slug = getattr(request, "restaurant_slug", None) or slug_from_url

    if not slug:
        raise Http404("Restaurant not found")

    restaurant = get_object_or_404(
        Restaurant.objects.select_related("subscription"),
        slug=slug,
    )

    # 🔴 НОВОЕ: проверка ручного отключения
    if not restaurant.active:
        raise Http404("Restaurant not found")

    # 🔴 Проверка подписки (твоя логика)
    ok, _reason = restaurant_is_active(restaurant)
    if not ok:
        raise Http404("Restaurant not found")

    return restaurant


def get_public_categories_queryset(restaurant: Restaurant):
    """
    Публичная выдача категорий:
    - скрываем системные категории (Unsorted)
    - скрываем архивные блюда
    """
    visible_dishes_qs = Dish.objects.filter(
        restaurant=restaurant,
        archived_at__isnull=True,
        category__is_system=False,
    ).order_by("id")

    return (
        Category.objects.filter(restaurant=restaurant, is_system=False)
        .order_by("id")
        .prefetch_related(Prefetch("dishes", queryset=visible_dishes_qs))
    )


class PublicRestaurantView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug: str):
        restaurant = get_public_restaurant_or_404(request, slug_from_url=slug)
        categories = get_public_categories_queryset(restaurant)

        lang = normalize_lang(request.query_params.get("lang"))
        ctx = {"request": request, "lang": lang}

        return Response(
            {
                "active": True,
                "lang": lang,
                "restaurant": PublicRestaurantSerializer(restaurant, context=ctx).data,
                "categories": PublicCategorySerializer(categories, many=True, context=ctx).data,
            }
        )


class PublicMenuView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug: str):
        restaurant = get_public_restaurant_or_404(request, slug_from_url=slug)
        categories = get_public_categories_queryset(restaurant)

        lang = normalize_lang(request.query_params.get("lang"))
        ctx = {"request": request, "lang": lang}

        return Response(
            {
                "active": True,
                "lang": lang,
                "restaurant": PublicRestaurantSerializer(restaurant, context=ctx).data,
                "categories": PublicCategorySerializer(categories, many=True, context=ctx).data,
            }
        )


class PublicRestaurantStatusView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug: str):
        slug_effective = getattr(request, "restaurant_slug", None) or slug
        if not slug_effective:
            return Response({"exists": False, "active": False}, status=200)

        restaurant = (
            Restaurant.objects.select_related("subscription")
            .filter(slug=slug_effective)
            .only("id", "slug")
            .first()
        )

        if not restaurant:
            return Response({"exists": False, "active": False}, status=200)

        ok, _reason = restaurant_is_active(restaurant)
        return Response({"exists": True, "active": bool(ok)}, status=200)


class PublicRestaurantBySubdomainView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        restaurant = get_public_restaurant_or_404(request, slug_from_url=None)
        data = PublicRestaurantSerializer(restaurant, context={"request": request}).data
        return Response(data)


class PublicMenuBySubdomainView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        restaurant = get_public_restaurant_or_404(request, slug_from_url=None)
        categories = get_public_categories_queryset(restaurant)

        lang = normalize_lang(request.query_params.get("lang"))
        ctx = {"request": request, "lang": lang}

        return Response(
            {
                "active": True,
                "lang": lang,
                "restaurant": PublicRestaurantSerializer(restaurant, context=ctx).data,
                "categories": PublicCategorySerializer(categories, many=True, context=ctx).data,
            }
        )