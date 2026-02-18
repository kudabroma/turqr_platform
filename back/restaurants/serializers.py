from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Restaurant, Category, Dish, Subscription, PaymentHistory


User = get_user_model()


class RestaurantMeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Restaurant
        fields = [
            "id",
            "name",
            "description",
            "address",
            "hours",
            "phone",
            "email",
            "is_open",
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
        # restaurant is writable for superusers, read-only enforced in view logic


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "restaurant"]
        read_only_fields = ["id"]
        # restaurant is writable for superusers, read-only enforced in view logic


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
