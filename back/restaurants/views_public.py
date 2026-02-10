from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.http import Http404
from django.shortcuts import get_object_or_404

from .models import Restaurant, Category
from .serializers_public import PublicRestaurantSerializer, PublicCategorySerializer

def get_public_restaurant_or_404(request, slug_from_url: str | None):
     """
     Возвращает ресторан для публичного доступа:
     1) сначала пытаемся взять slug из subdomain middleware: request.restaurant_slug
     2) если его нет — используем slug из URL (fallback)
     3) restaurant.active=False -> 404 (для туриста "не существует")
     """
     slug = getattr(request, "restaurant_slug", None) or slug_from_url


     if not slug:
         # Нет slug ни в субдомене, ни в URL — публичный запрос невалиден
         raise Http404("Restaurant not found")

     # Важно: active=True прямо в запросе, чтобы inactive выглядел как "не существует"
     return get_object_or_404(Restaurant, slug=slug, active=True)

def restaurant_is_active(restaurant: Restaurant) -> tuple[bool, str | None]:
    """
    Сейчас: активность берём из поля restaurant.active.
    Потом сюда же добавишь проверку подписки.
    """
    active = bool(getattr(restaurant, "active", True))
    return active, (None if active else "inactive")



class PublicRestaurantView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug: str):
        restaurant = get_public_restaurant_or_404(request, slug_from_url=slug)
        categories = Category.objects.filter(restaurant=restaurant).order_by("id")

        return Response({
            "active": True,
            "restaurant": PublicRestaurantSerializer(restaurant).data,
            "categories": PublicCategorySerializer(categories, many=True).data,
        })

class PublicMenuView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug: str):
        restaurant = get_public_restaurant_or_404(request, slug_from_url=slug)
        categories = Category.objects.filter(restaurant=restaurant).order_by("id")

        return Response({
            "active": True,
            "restaurant": PublicRestaurantSerializer(restaurant).data,
            "categories": PublicCategorySerializer(categories, many=True).data,
        })


# views_public.py
class PublicRestaurantStatusView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug: str):
        slug_effective = getattr(request, "restaurant_slug", None) or slug

        restaurant = Restaurant.objects.filter(slug=slug_effective, active=True).only("active").first()
        if not restaurant:
            return Response({"exists": False, "active": False}, status=200)

        return Response({"exists": True, "active": True}, status=200)
        
class PublicRestaurantBySubdomainView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        restaurant = get_public_restaurant_or_404(request, slug_from_url=None)
        data = PublicRestaurantSerializer(restaurant).data
        return Response(data)


class PublicMenuBySubdomainView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        restaurant = get_public_restaurant_or_404(request, slug_from_url=None)
        categories = Category.objects.filter(restaurant=restaurant).order_by("id")

        return Response({
            "active": True,
            "restaurant": PublicRestaurantSerializer(restaurant).data,
            "categories": PublicCategorySerializer(categories, many=True).data,
        })


