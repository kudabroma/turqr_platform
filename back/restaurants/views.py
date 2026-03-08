from django.contrib.auth import authenticate, login, logout, get_user_model
from django.db import transaction
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework import permissions, serializers, status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Case, When, Value, IntegerField
from django.http import HttpResponse
from django.conf import settings
import io
import qrcode

from .qr.generator import compose_qr_template
from .models import Restaurant, Category, Dish, PaymentHistory
from .serializers import (
    UserSerializer,
    CategorySerializer,
    CategorySuperuserSerializer,
    DishSerializer,
    DishSuperuserSerializer,
    CategoryWithDishesSerializer,
    SubscriptionSerializer,
    PaymentHistorySerializer,
    RestaurantMeSerializer,
    RestaurantUpdateSerializer,
)
from .permissions import HasActiveSubscriptionOrReadOnly
from .services.unsorted import get_unsorted_category

User = get_user_model()


# =====================
# Helpers
# =====================
def _get_user_restaurant(user):
    return getattr(user, "restaurant", None)


# =====================
# Restaurant: /api/restaurants/me/ (GET + PATCH)
# =====================
class RestaurantMeView(APIView):
    """
    GET /api/restaurants/me/
    PATCH /api/restaurants/me/
    """

    permission_classes = [permissions.IsAuthenticated, HasActiveSubscriptionOrReadOnly]
    # ✅ для загрузки logo (ImageField) через multipart/form-data
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        user = request.user

        if user.is_superuser:
            return Response(
                {"detail": "Superuser has no single restaurant."},
                status=status.HTTP_403_FORBIDDEN,
            )

        restaurant = _get_user_restaurant(user)
        if restaurant is None:
            return Response(
                {"detail": "User has no associated restaurant."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response(RestaurantMeSerializer(restaurant, context={"request": request}).data)

    def patch(self, request):
        user = request.user

        if user.is_superuser:
            return Response(
                {"detail": "Superuser cannot update restaurant here."},
                status=status.HTTP_403_FORBIDDEN,
            )

        restaurant = _get_user_restaurant(user)
        if restaurant is None:
            return Response(
                {"detail": "User has no associated restaurant."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = RestaurantUpdateSerializer(restaurant, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # ✅ возвращаем свежие данные с правильным context
        restaurant.refresh_from_db()
        return Response(RestaurantMeSerializer(restaurant, context={"request": request}).data)


# =====================
# Auth
# =====================
class RegistrationView(APIView):
    """
    POST /api/auth/register/
    {
        "username": "admin",
        "password": "secret123",
        "restaurant_name": "My Restaurant"
    }
    """

    permission_classes = [permissions.AllowAny]

    class InputSerializer(UserSerializer):
        restaurant_name = serializers.CharField(write_only=True, max_length=255)

        class Meta(UserSerializer.Meta):
            fields = ["id", "username", "password", "restaurant_name"]

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            restaurant = Restaurant.objects.create(
                name=serializer.validated_data["restaurant_name"]
            )

            # ✅ ensure Unsorted exists for the new restaurant
            get_unsorted_category(restaurant)

            user = User(
                username=serializer.validated_data["username"],
                restaurant=restaurant,
            )
            user.set_password(serializer.validated_data["password"])
            user.save()

        return Response(
            {"id": user.id, "username": user.username, "restaurant": restaurant.id},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """
    POST /api/auth/login/
    {"username": "...", "password": "..."}
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response(
                {"detail": "Неверный логин или пароль."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        login(request, user)
        return Response(
            {"id": user.id, "username": user.username, "restaurant": getattr(user, "restaurant_id", None)}
        )


class LogoutView(APIView):
    """POST /api/auth/logout/"""

    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    """GET /api/auth/me/"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({"id": user.id, "username": user.username, "restaurant": getattr(user, "restaurant_id", None)})


# =====================
# Categories CRUD
# =====================
class CategoryViewSet(viewsets.ModelViewSet):
    """
    CRUD для категорий меню.
    Business user работает только со своим рестораном.
    Superuser может указывать restaurant вручную.
    """

    permission_classes = [permissions.IsAuthenticated, HasActiveSubscriptionOrReadOnly]

    def get_serializer_class(self):
        if self.request.user.is_superuser:
            return CategorySuperuserSerializer
        return CategorySerializer

    def get_queryset(self):
        user = self.request.user

        if user.is_superuser:
            return Category.objects.all().order_by("sort_order", "id")

        restaurant = _get_user_restaurant(user)
        if not restaurant:
            return Category.objects.none()

        return Category.objects.filter(
            restaurant=restaurant
        ).order_by("sort_order", "id")

    def perform_create(self, serializer):
        user = self.request.user

        if user.is_superuser:
            serializer.save()
            return

        restaurant = _get_user_restaurant(user)
        if not restaurant:
            raise ValidationError({"restaurant": "User has no associated restaurant."})

        # ставим новую категорию в конец списка (перед Unsorted)
        last = Category.objects.filter(
            restaurant=restaurant,
            is_system=False
        ).order_by("-sort_order").first()

        next_order = (last.sort_order + 1) if last else 0

        serializer.save(
            restaurant=restaurant,
            sort_order=next_order
        )

    def perform_update(self, serializer):
        category = self.get_object()

        # 🚫 system category нельзя менять
        if category.is_system:
            raise ValidationError({"detail": "System category cannot be modified."})

        user = self.request.user

        if user.is_superuser:
            serializer.save()
            return

        restaurant = _get_user_restaurant(user)
        if not restaurant:
            raise ValidationError({"restaurant": "User has no associated restaurant."})

        serializer.save(restaurant=restaurant)

    def destroy(self, request, *args, **kwargs):
        """
        DELETE category:
        - system category нельзя удалять
        - блюда переносим в Unsorted
        - категорию удаляем
        """

        category = self.get_object()

        if category.is_system:
            raise ValidationError({"detail": "System category cannot be deleted."})

        unsorted = get_unsorted_category(category.restaurant)
        now = timezone.now()

        Dish.objects.filter(category=category).update(
            category=unsorted,
            moved_to_unsorted_at=now,
        )

        category.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["post"])
    def reorder(self, request):
        """
        Меняет порядок категорий (drag & drop)
        """

        restaurant = _get_user_restaurant(request.user)
        if not restaurant:
            raise ValidationError({"restaurant": "User has no associated restaurant."})
        items = request.data.get("items", [])

        for item in items:
            Category.objects.filter(
                id=item["id"],
                restaurant=restaurant,
                is_system=False
            ).update(sort_order=item["sort_order"])

        # гарантируем что Unsorted всегда последняя
        unsorted = Category.objects.filter(
            restaurant=restaurant,
            is_system=True
        ).first()

        if unsorted:
            last = Category.objects.filter(
                restaurant=restaurant,
                is_system=False
            ).order_by("-sort_order").first()

            unsorted.sort_order = (last.sort_order + 1) if last else 0
            unsorted.save()

        return Response({"status": "ok"})


# =====================
# Dishes CRUD
# =====================
class DishViewSet(viewsets.ModelViewSet):
    """
    CRUD для блюд меню.
    Business user работает только со своим рестораном.
    Superuser может со всеми, но restaurant обязателен при создании.
    """

    permission_classes = [permissions.IsAuthenticated, HasActiveSubscriptionOrReadOnly]
    # ✅ для загрузки image через multipart/form-data
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.request.user.is_superuser:
            return DishSuperuserSerializer
        return DishSerializer

    def get_queryset(self):
        user = self.request.user

        # superuser sees all
        if getattr(user, "is_superuser", False):
            return Dish.objects.all()

        restaurant = getattr(user, "restaurant", None)
        if not restaurant:
            return Dish.objects.none()

        return Dish.objects.filter(restaurant=restaurant)

    def perform_create(self, serializer):
        user = self.request.user

        if user.is_superuser:
            restaurant = serializer.validated_data.get("restaurant")
            if restaurant is None:
                raise serializers.ValidationError({"restaurant": "This field is required."})
            serializer.save(restaurant=restaurant)
            return

        restaurant = _get_user_restaurant(user)
        if not restaurant:
            raise serializers.ValidationError({"restaurant": "User has no associated restaurant."})

        category = serializer.validated_data.get("category")
        if category and category.restaurant_id != restaurant.id:
            raise serializers.ValidationError({"category": "Category must belong to your restaurant."})

        serializer.save(restaurant=self.request.user.restaurant)

    def perform_update(self, serializer):
        user = self.request.user
        instance = self.get_object()

        # --- superuser ---
        if user.is_superuser:
            old_category = instance.category
            saved = serializer.save()
            new_category = saved.category

            # ✅ lifecycle: если из системной -> в обычную, сбросить
            if old_category and old_category.is_system and new_category and not new_category.is_system:
                Dish.objects.filter(pk=saved.pk).update(moved_to_unsorted_at=None, archived_at=None)

            # если в системную — поставить moved_to_unsorted_at (если не было)
            if new_category and new_category.is_system and saved.moved_to_unsorted_at is None:
                Dish.objects.filter(pk=saved.pk).update(moved_to_unsorted_at=timezone.now())

            return

        # --- business user ---
        restaurant = _get_user_restaurant(user)
        if not restaurant:
            raise serializers.ValidationError({"restaurant": "User has no associated restaurant."})

        if instance.restaurant_id != restaurant.id:
            raise serializers.ValidationError({"detail": "You cannot modify this dish."})

        new_category = serializer.validated_data.get("category")
        if new_category and new_category.restaurant_id != restaurant.id:
            raise serializers.ValidationError({"category": "Category must belong to your restaurant."})

        old_category = instance.category
        saved = serializer.save(restaurant=restaurant)
        new_category_final = saved.category

        # ✅ lifecycle after save
        if old_category and old_category.is_system and new_category_final and not new_category_final.is_system:
            Dish.objects.filter(pk=saved.pk).update(moved_to_unsorted_at=None, archived_at=None)

        if new_category_final and new_category_final.is_system and saved.moved_to_unsorted_at is None:
            Dish.objects.filter(pk=saved.pk).update(moved_to_unsorted_at=timezone.now())

    def perform_destroy(self, instance):
        user = self.request.user

        if user.is_superuser:
            instance.delete()
            return

        restaurant = _get_user_restaurant(user)
        if not restaurant:
            raise serializers.ValidationError({"restaurant": "User has no associated restaurant."})

        if instance.restaurant_id != restaurant.id:
            raise serializers.ValidationError({"detail": "You cannot delete this dish."})

        instance.delete()


# =====================
# Payment History (read-only)
# =====================
class PaymentHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """История платежей только для текущего ресторана."""

    serializer_class = PaymentHistorySerializer
    permission_classes = [permissions.IsAuthenticated, HasActiveSubscriptionOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        qs = PaymentHistory.objects.all().order_by("-paid_at")

        if user.is_superuser:
            return qs

        restaurant = _get_user_restaurant(user)
        if not restaurant:
            return PaymentHistory.objects.none()

        return qs.filter(restaurant=restaurant)


# =====================
# Menu (Admin)
# =====================
class MenuView(APIView):
    """
    GET /api/menu/
    Возвращает категории и блюда ресторана текущего пользователя.
    Поддерживает ?lang=en (по умолчанию tr).
    """

    permission_classes = [permissions.IsAuthenticated, HasActiveSubscriptionOrReadOnly]

    def get(self, request):
        user = request.user

        # 🔹 Определяем ресторан
        if user.is_superuser and request.query_params.get("restaurant_id"):
            try:
                restaurant = Restaurant.objects.get(pk=request.query_params.get("restaurant_id"))
            except Restaurant.DoesNotExist:
                return Response(
                    {"detail": "Restaurant not found."},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            restaurant = _get_user_restaurant(user)
            if restaurant is None:
                return Response(
                    {"detail": "User has no associated restaurant."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        # 🔹 Получаем язык (по умолчанию TR)
        lang = request.query_params.get("lang", "tr")
        lang = lang.lower()
        if not lang.startswith("en"):
            lang = "tr"
        else:
            lang = "en"

        # 🔹 Загружаем категории с блюдами
        categories = (
            Category.objects
            .filter(restaurant=restaurant)
            .annotate(
                _sys_last=Case(
                    When(is_system=True, then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField(),
                )
            )
            .order_by("_sys_last", "id")   # ✅ system (Unsorted) всегда в конце
            .prefetch_related("dishes")
        )

        # 🔹 Передаем lang в context
        serializer = CategoryWithDishesSerializer(
            categories,
            many=True,
            context={
                "request": request,
                "lang": lang,
            }
        )
        return Response(serializer.data)   # ✅ ВАЖНО: без {"categories": ...}
    
# =====================
# Subscription
# =====================
class SubscriptionView(APIView):
    """
    GET /api/subscription/
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.is_superuser:
            return Response(
                {"error": "Superusers cannot access subscription information."},
                status=status.HTTP_403_FORBIDDEN,
            )

        restaurant = _get_user_restaurant(user)
        if restaurant is None:
            return Response(
                {"error": "User has no associated restaurant."},
                status=status.HTTP_403_FORBIDDEN,
            )

        subscription = getattr(restaurant, "subscription", None)
        if not subscription:
            return Response({"error": "Подписка не оформлена."}, status=status.HTTP_404_NOT_FOUND)

        serializer = SubscriptionSerializer(subscription)
        return Response(serializer.data)
    # =====================
# QR Admin Endpoints
# =====================

class AdminQrPngView(APIView):
    """
    GET /api/admin/qr/png/
    Возвращает обычный QR код меню ресторана
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        restaurant = getattr(request.user, "restaurant", None)

        if not restaurant:
            return Response(
                {"detail": "User has no restaurant."},
                status=status.HTTP_403_FORBIDDEN,
            )

        slug = restaurant.slug

        menu_url = f"https://{slug}.turqr.com/menu"

        qr = qrcode.make(menu_url)

        buffer = io.BytesIO()
        qr.save(buffer, format="PNG")
        buffer.seek(0)

        return HttpResponse(buffer.getvalue(), content_type="image/png")


class AdminQrTableStickerView(APIView):
    """
    GET /api/admin/qr/table-sticker/
    Возвращает sticker PNG
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        restaurant = getattr(request.user, "restaurant", None)

        if not restaurant:
            return Response(
                {"detail": "User has no restaurant."},
                status=status.HTTP_403_FORBIDDEN,
            )

        slug = restaurant.slug

        image = compose_qr_template(slug)

        response = HttpResponse(image.getvalue(), content_type="image/png")
        response["Content-Disposition"] = f'attachment; filename="turqr-{slug}-sticker.png"'

        return response