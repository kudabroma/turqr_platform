from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Restaurant, Category, Dish, Subscription, PaymentHistory

User = get_user_model()


class RestaurantMeSerializer(serializers.ModelSerializer):
    """
    Ответ для /api/restaurants/me/
    Держим backward compatibility для фронта:
    active/plan/paid_until возвращаем, но они вычисляются из Subscription.
    """

    active = serializers.SerializerMethodField()
    plan = serializers.SerializerMethodField()
    paid_until = serializers.SerializerMethodField()

    def get_active(self, obj: Restaurant) -> bool:
        sub = getattr(obj, "subscription", None)
        return bool(sub and sub.is_active())

    def get_plan(self, obj: Restaurant) -> str:
        sub = getattr(obj, "subscription", None)
        return (getattr(sub, "tariff", "") or "basic") if sub else "basic"

    def get_paid_until(self, obj: Restaurant):
        sub = getattr(obj, "subscription", None)
        if not sub or not sub.expires_at:
            return None
        # раньше было DateField, возвращаем YYYY-MM-DD
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


class DishSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dish
        fields = ["id", "name", "description", "price", "category", "restaurant"]
        read_only_fields = ["id"]


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "restaurant"]
        read_only_fields = ["id"]


class DishReadSerializer(serializers.ModelSerializer):
    """
    Read-only вариант блюда без лишних технических полей.
    Используется в выдаче меню.
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