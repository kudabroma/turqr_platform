from django.contrib.auth import authenticate, login, logout, get_user_model
from django.db import transaction
from rest_framework import permissions, serializers, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Restaurant, Category, Dish, PaymentHistory
from .serializers import (
    UserSerializer,
    CategorySerializer,
    CategorySuperuserSerializer,
    DishSerializer,
    CategoryWithDishesSerializer,
    SubscriptionSerializer,
    PaymentHistorySerializer,
    RestaurantMeSerializer,
    RestaurantUpdateSerializer,
)

from .permissions import HasActiveSubscriptionOrReadOnly

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

        return Response(RestaurantMeSerializer(restaurant).data)

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

        # Возвращаем формат как GET
        return Response(RestaurantMeSerializer(restaurant).data)


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
        return Response({"id": user.id, "username": user.username, "restaurant": user.restaurant_id})


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
        return Response({"id": user.id, "username": user.username, "restaurant": user.restaurant_id})


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
            return Category.objects.all()

        if not getattr(user, "restaurant", None):
            return Category.objects.none()

        return Category.objects.filter(restaurant=user.restaurant)

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_superuser:
            # restaurant придёт из запроса и провалидируется CategorySuperuserSerializer
            serializer.save()
            return

        if not getattr(user, "restaurant", None):
            raise ValidationError({"restaurant": "User has no associated restaurant."})

        serializer.save(restaurant=user.restaurant)

    def perform_update(self, serializer):
        user = self.request.user
        if user.is_superuser:
            serializer.save()
            return

        if not getattr(user, "restaurant", None):
            raise ValidationError({"restaurant": "User has no associated restaurant."})

        # бизнесу запрещаем менять ресторан категории
        serializer.save(restaurant=user.restaurant)


# =====================
# Dishes CRUD
# =====================
class DishViewSet(viewsets.ModelViewSet):
    """
    CRUD для блюд меню.
    Business user работает только со своим рестораном.
    Superuser может со всеми, но restaurant обязателен при создании.
    """

    serializer_class = DishSerializer
    permission_classes = [permissions.IsAuthenticated, HasActiveSubscriptionOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Dish.objects.all()

        restaurant = _get_user_restaurant(user)
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

        # ВАЖНО: категория должна принадлежать этому же ресторану
        category = serializer.validated_data.get("category")
        if category and category.restaurant_id != restaurant.id:
            raise serializers.ValidationError({"category": "Category must belong to your restaurant."})

        serializer.save(restaurant=restaurant)

    def perform_update(self, serializer):
        user = self.request.user

        if user.is_superuser:
            serializer.save()
            return

        restaurant = _get_user_restaurant(user)
        if not restaurant:
            raise serializers.ValidationError({"restaurant": "User has no associated restaurant."})

        instance = self.get_object()
        if instance.restaurant_id != restaurant.id:
            raise serializers.ValidationError({"detail": "You cannot modify this dish."})

        category = serializer.validated_data.get("category")
        if category and category.restaurant_id != restaurant.id:
            raise serializers.ValidationError({"category": "Category must belong to your restaurant."})

        serializer.save(restaurant=restaurant)

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
# Menu
# =====================
class MenuView(APIView):
    """
    GET /api/menu/
    Возвращает категории и блюда ресторана текущего пользователя.
    """

    permission_classes = [permissions.IsAuthenticated, HasActiveSubscriptionOrReadOnly]

    def get(self, request):
        user = request.user

        if user.is_superuser and request.query_params.get("restaurant_id"):
            try:
                restaurant = Restaurant.objects.get(pk=request.query_params.get("restaurant_id"))
            except Restaurant.DoesNotExist:
                return Response({"detail": "Restaurant not found."}, status=status.HTTP_404_NOT_FOUND)
        else:
            restaurant = _get_user_restaurant(user)
            if restaurant is None:
                return Response(
                    {"detail": "User has no associated restaurant."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        categories = Category.objects.filter(restaurant=restaurant).prefetch_related("dishes")
        serializer = CategoryWithDishesSerializer(categories, many=True)
        return Response(serializer.data)


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