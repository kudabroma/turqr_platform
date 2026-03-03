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

ALLOW_PUBLIC_IN_DEBUG = True


def restaurant_is_active(restaurant: Restaurant) -> tuple[bool, str | None]:
    sub = getattr(restaurant, "subscription", None)

    if not sub:
        if settings.DEBUG and ALLOW_PUBLIC_IN_DEBUG:
            return True, None
        return False, "no_subscription"

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
    Берём slug:
    1) из subdomain middleware: request.restaurant_slug
    2) иначе из URL (slug_from_url)
    """
    slug = getattr(request, "restaurant_slug", None) or slug_from_url
    if not slug:
        raise Http404("Restaurant not found")

    restaurant = get_object_or_404(
        Restaurant.objects.select_related("subscription"),
        slug=slug,
    )

    if not restaurant.active:
        raise Http404("Restaurant not found")

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
        is_active=True,  
        category__is_system=False,
    ).order_by("id")

    return (
        Category.objects.filter(restaurant=restaurant, is_system=False)
        .order_by("id")
        .prefetch_related(Prefetch("dishes", queryset=visible_dishes_qs))
    )


def build_public_payload(request, restaurant: Restaurant, categories_qs):
    lang = normalize_lang(request.query_params.get("lang"))
    ctx = {"request": request, "lang": lang}

    return {
        "active": True,
        "lang": lang,
        "restaurant": PublicRestaurantSerializer(restaurant, context=ctx).data,
        "categories": PublicCategorySerializer(categories_qs, many=True, context=ctx).data,
    }


class PublicRestaurantView(APIView):
    permission_classes = [permissions.AllowAny]

    # ✅ slug optional: работает и для /public/restaurant/<slug>/ и для /public/restaurant/
    def get(self, request, slug: str | None = None):
        restaurant = get_public_restaurant_or_404(request, slug_from_url=slug)
        categories = get_public_categories_queryset(restaurant)
        return Response(build_public_payload(request, restaurant, categories))


class PublicMenuView(APIView):
    permission_classes = [permissions.AllowAny]

    # ✅ slug optional: работает и для /public/menu/<slug>/ и для /public/menu/
    def get(self, request, slug: str | None = None):
        restaurant = get_public_restaurant_or_404(request, slug_from_url=slug)
        categories = get_public_categories_queryset(restaurant)
        return Response(build_public_payload(request, restaurant, categories))


class PublicRestaurantStatusView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug: str | None = None):
        slug_effective = getattr(request, "restaurant_slug", None) or slug
        if not slug_effective:
            return Response({"exists": False, "active": False}, status=200)

        restaurant = (
            Restaurant.objects.select_related("subscription")
            .filter(slug=slug_effective)
            .only("id", "slug", "active")
            .first()
        )

        if not restaurant:
            return Response({"exists": False, "active": False}, status=200)

        if not restaurant.active:
            return Response({"exists": True, "active": False}, status=200)

        ok, _reason = restaurant_is_active(restaurant)
        return Response({"exists": True, "active": bool(ok)}, status=200)


class PublicRestaurantBySubdomainView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        restaurant = get_public_restaurant_or_404(request, slug_from_url=None)

        lang = normalize_lang(request.query_params.get("lang"))
        ctx = {"request": request, "lang": lang}

        # ✅ BACKWARD COMPAT: возвращаем ПРЯМО объект ресторана, как раньше
        return Response(PublicRestaurantSerializer(restaurant, context=ctx).data)


class PublicMenuBySubdomainView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        restaurant = get_public_restaurant_or_404(request, slug_from_url=None)
        categories = get_public_categories_queryset(restaurant)
        return Response(build_public_payload(request, restaurant, categories))