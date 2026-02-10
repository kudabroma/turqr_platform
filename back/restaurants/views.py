from django.contrib.auth import authenticate, login, logout, get_user_model
from django.db import transaction
from rest_framework import permissions, serializers, status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Restaurant, Category, Dish, Subscription, PaymentHistory
from .serializers import (
    UserSerializer,
    CategorySerializer,
    DishSerializer,
    CategoryWithDishesSerializer,
    SubscriptionSerializer,
    PaymentHistorySerializer,
)
from .permissions import HasActiveSubscription

User = get_user_model()


class RegistrationView(APIView):
    """
    Регистрация пользователя и ресторана.

    Пример запроса:
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
            {
                "id": user.id,
                "username": user.username,
                "restaurant": restaurant.id,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """
    Классический логин по логину и паролю.

    POST /api/auth/login/
    {
        "username": "admin",
        "password": "secret123"
    }

    При успешном логине создаётся сессия (SessionAuthentication).
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
            {
                "id": user.id,
                "username": user.username,
                "restaurant": user.restaurant_id,
            }
        )


class LogoutView(APIView):
    """
    Выход пользователя, уничтожение сессии.
    """

    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CategoryViewSet(viewsets.ModelViewSet):
    """
    CRUD для категорий меню.
    Пользователь может работать только со своим рестораном.
    """

    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated, HasActiveSubscription]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Category.objects.all()
        return Category.objects.filter(restaurant=user.restaurant)

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_superuser:
            restaurant = serializer.validated_data.get("restaurant")
            if restaurant is None:
                raise ValidationError({"restaurant": "This field is required."})
            serializer.save(restaurant=restaurant)
        else:
            serializer.save(restaurant=user.restaurant)
    def perform_update(self, serializer):
        user = self.request.user
        if user.is_superuser:
            serializer.save()
        else:
            serializer.save(restaurant=user.restaurant)



class DishViewSet(viewsets.ModelViewSet):
    """
    CRUD для блюд меню.
    Пользователь может работать только со своим рестораном.
    """

    serializer_class = DishSerializer
    permission_classes = [permissions.IsAuthenticated, HasActiveSubscription]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Dish.objects.all()
        return Dish.objects.filter(restaurant=user.restaurant)

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_superuser:
            restaurant = serializer.validated_data.get("restaurant")
            if restaurant is None:
                raise ValidationError({"restaurant": "This field is required."})
            serializer.save(restaurant=restaurant)
        else:
            serializer.save(restaurant=user.restaurant)
    def perform_update(self, serializer):
        user = self.request.user
        if user.is_superuser:
            serializer.save()
        else:
            serializer.save(restaurant=user.restaurant)



class PaymentHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    История платежей только для текущего ресторана.
    """

    serializer_class = PaymentHistorySerializer
    permission_classes = [permissions.IsAuthenticated, HasActiveSubscription]

    def get_queryset(self):
        user = self.request.user
        qs = PaymentHistory.objects.all().order_by("-paid_at")
        if user.is_superuser:
            return qs
        return qs.filter(restaurant=user.restaurant)


class MenuView(APIView):
    """
    GET /api/menu/

    Возвращает все категории и блюда ресторана текущего пользователя.
    """

    permission_classes = [permissions.IsAuthenticated, HasActiveSubscription]

    def get(self, request):
        # Superuser can request menu for any restaurant via ?restaurant_id=
        user = request.user
        restaurant = None
        if user.is_superuser and request.query_params.get("restaurant_id"):
            try:
                restaurant = Restaurant.objects.get(pk=request.query_params.get("restaurant_id"))
            except Restaurant.DoesNotExist:
                return Response({"detail": "Restaurant not found."}, status=status.HTTP_404_NOT_FOUND)
        else:
            restaurant = user.restaurant

        categories = Category.objects.filter(restaurant=restaurant).prefetch_related("dishes")
        serializer = CategoryWithDishesSerializer(categories, many=True)
        return Response(serializer.data)


class SubscriptionView(APIView):
    """
    GET /api/subscription/

    Возвращает информацию о подписке текущего ресторана.
    Only available to business users with restaurants.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.is_superuser:
            return Response({"error": "Superusers cannot access subscription information."}, status=status.HTTP_403_FORBIDDEN)

        if not hasattr(user, 'restaurant') or user.restaurant is None:
            return Response({"error": "User has no associated restaurant."}, status=status.HTTP_403_FORBIDDEN)

        restaurant = user.restaurant
        subscription = getattr(restaurant, "subscription", None)
        if not subscription:
            return Response({"error": "Подписка не оформлена."}, status=status.HTTP_404_NOT_FOUND)

        serializer = SubscriptionSerializer(subscription)
        return Response(serializer.data)
