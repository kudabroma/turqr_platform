from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Restaurant, Category, Dish, Subscription, PaymentHistory

User = get_user_model()


# =========================
# Restaurant: /api/restaurants/me/
# =========================
class RestaurantMeSerializer(serializers.ModelSerializer):
    """
    Ответ для /api/restaurants/me/
    Backward compatibility для фронта:
    active/plan/paid_until возвращаем, но они вычисляются из Subscription.
    """

    active = serializers.SerializerMethodField()
    plan = serializers.SerializerMethodField()
    paid_until = serializers.SerializerMethodField()

    def get_active(self, obj: Restaurant) -> bool:
        sub = getattr(obj, "subscription", None)
        if not sub:
            return False
        if hasattr(sub, "is_active") and callable(getattr(sub, "is_active")):
            return bool(sub.is_active())
        return getattr(sub, "status", "") in ("active", "trial")

    def get_plan(self, obj: Restaurant) -> str:
        sub = getattr(obj, "subscription", None)
        return (getattr(sub, "tariff", "") or "basic") if sub else "basic"

    def get_paid_until(self, obj: Restaurant):
        sub = getattr(obj, "subscription", None)
        if not sub or not getattr(sub, "expires_at", None):
            return None
        return sub.expires_at.date().isoformat()

    class Meta:
        model = Restaurant
        fields = [
            "id",
            "name",
            "slug",
            "contacts",
            "phone",
            "email",
            "address",
            "logo",
            "front_template",
            # compat:
            "active",
            "plan",
            "paid_until",
        ]


class RestaurantUpdateSerializer(serializers.ModelSerializer):
    """
    PATCH /api/restaurants/me/
    Только реальные поля Restaurant (без computed полей).
    """

    class Meta:
        model = Restaurant
        fields = [
            "name",
            "slug",
            "contacts",
            "phone",
            "email",
            "address",
            "logo",
            "front_template",
        ]


# =========================
# Auth / Users
# =========================
class UserSerializer(serializers.ModelSerializer):
    """
    Сериализатор пользователя.
    Пароль принимается только на запись и хэшируется стандартными методами Django.
    """

    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["id", "username", "password", "restaurant"]
        read_only_fields = ["id", "restaurant"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


# =========================
# Categories (Admin)
# =========================
class CategorySerializer(serializers.ModelSerializer):
    """
    Для business user: restaurant read-only, бек сам подставляет в perform_create.
    """
    restaurant = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "restaurant", "is_system"]
        read_only_fields = ["id", "restaurant", "is_system"]


class CategorySuperuserSerializer(serializers.ModelSerializer):
    """
    Для superuser: restaurant обязателен (он может создавать категории для любого ресторана).
    """
    restaurant = serializers.PrimaryKeyRelatedField(queryset=Restaurant.objects.all(), required=True)

    class Meta:
        model = Category
        fields = ["id", "name", "restaurant", "is_system"]
        # is_system делаем read-only: системные категории создаём/контролим сервером
        read_only_fields = ["id", "is_system"]


# =========================
# Dishes (Admin)
# =========================
class DishSerializer(serializers.ModelSerializer):
    """
    Для business user: restaurant read-only (бек подставит).
    Также отдаём lifecycle поля read-only (для UI/фильтрации), но не даём менять напрямую.
    """
    restaurant = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Dish
        fields = [
            "id",
            "name",
            "description",
            "price",
            "category",
            "restaurant",
            # lifecycle:
            "moved_to_unsorted_at",
            "archived_at",
        ]
        read_only_fields = ["id", "restaurant", "moved_to_unsorted_at", "archived_at"]


class DishSuperuserSerializer(serializers.ModelSerializer):
    restaurant = serializers.PrimaryKeyRelatedField(queryset=Restaurant.objects.all(), required=True)

    class Meta:
        model = Dish
        fields = [
            "id",
            "name",
            "description",
            "price",
            "category",
            "restaurant",
            # lifecycle:
            "moved_to_unsorted_at",
            "archived_at",
        ]
        read_only_fields = ["id", "moved_to_unsorted_at", "archived_at"]


# =========================
# Public Menu (Tourists)
# =========================
class DishReadSerializer(serializers.ModelSerializer):
    """
    Read-only вариант блюда без лишних технических полей.
    Используется в выдаче меню (туристы).
    """

    class Meta:
        model = Dish
        fields = ["id", "name", "description", "price", "category"]


class CategoryWithDishesSerializer(serializers.ModelSerializer):
    """
    Категория с вложенными блюдами для эндпоинта /menu.
    """

    dishes = DishReadSerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "dishes"]


# =========================
# Subscription / Payments
# =========================
class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = [
            "tariff",
            "status",
            "started_at",
            "expires_at",
        ]


class PaymentHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentHistory
        fields = [
            "id",
            "amount",
            "paid_at",
            "payment_method",
            "status",
        ]