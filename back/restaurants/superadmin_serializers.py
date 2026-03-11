from __future__ import annotations

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.utils import timezone
from datetime import timedelta

from rest_framework import serializers

from .models import Restaurant, Subscription

from .models import Restaurant, Subscription

try:
    from .models import Payment  # если есть — ок
except Exception:
    Payment = None  # если нет — не падаем


User = get_user_model()


# -------------------------
# Restaurants
# -------------------------

class SuperAdminRestaurantSerializer(serializers.ModelSerializer):
    active = serializers.SerializerMethodField()
    plan = serializers.SerializerMethodField()
    paid_until = serializers.SerializerMethodField()

    class Meta:
        model = Restaurant
        fields = [
            "id",
            "slug",
            "name",
            "active",      # теперь безопасно
            "created_at",
            "plan",
            "paid_until",
        ]
        read_only_fields = ["id", "created_at", "plan", "paid_until", "active"]

    def get_active(self, obj: Restaurant):
        # поддержка разных схем модели
        for attr in ("active", "is_active", "enabled"):
            if hasattr(obj, attr):
                return bool(getattr(obj, attr))
        # если поля нет вообще — считаем ресторан активным по умолчанию
        return True

    def _get_subscription(self, obj: Restaurant):
        return (
            Subscription.objects.filter(restaurant=obj)
            .order_by("-expires_at", "-id")
            .first()
        )

    def get_plan(self, obj: Restaurant):
        sub = self._get_subscription(obj)
        return getattr(sub, "plan", None) if sub else None

    def get_paid_until(self, obj: Restaurant):
        sub = self._get_subscription(obj)
        return getattr(sub, "expires_at", None) if sub else None


class SuperAdminRestaurantCreateSerializer(serializers.ModelSerializer):
    # принимаем active, но маппим куда получится
    active = serializers.BooleanField(required=False)

    class Meta:
        model = Restaurant
        fields = ["name", "slug", "active"]

    def validate_slug(self, value: str):
        value = (value or "").strip().lower()
        if not value:
            raise serializers.ValidationError("slug is required")
        return value

    def create(self, validated_data):
        active = validated_data.pop("active", None)

        obj = Restaurant.objects.create(**validated_data)

        # пробуем записать в то поле, которое реально есть
        if active is not None:
            if hasattr(obj, "active"):
                obj.active = active
                obj.save(update_fields=["active"])
            elif hasattr(obj, "is_active"):
                obj.is_active = active
                obj.save(update_fields=["is_active"])
            elif hasattr(obj, "enabled"):
                obj.enabled = active
                obj.save(update_fields=["enabled"])

        return obj


# -------------------------
# Business Users
# -------------------------

class SuperAdminBusinessUserSerializer(serializers.ModelSerializer):
    restaurant = serializers.SerializerMethodField()
    display_email = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()  # 🔥 переопределяем email

    class Meta:
        model = User
        fields = [
            "id",
            "email",          # теперь это безопасное поле
            "display_email",  # дополнительное
            "first_name",
            "last_name",
            "is_active",
            "date_joined",
            "last_login",
            "restaurant",
        ]

    # 🔹 Гарантируем что email не пустой
    def get_email(self, obj):
        email = (getattr(obj, "email", "") or "").strip()
        if email:
            return email

        username = (getattr(obj, "username", "") or "").strip()
        if username:
            return username

        return f"user#{obj.id}"

    # 🔹 display_email можно оставить тем же самым
    def get_display_email(self, obj):
        return self.get_email(obj)

    def get_restaurant(self, obj):
        r = getattr(obj, "restaurant", None)
        if not r:
            return None
        return {
            "id": getattr(r, "id", None),
            "name": getattr(r, "name", None),
            "slug": getattr(r, "slug", None),
        }

class SuperAdminBusinessUserCreateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    is_active = serializers.BooleanField(required=False, default=True)
    restaurant_id = serializers.IntegerField()

    def validate_username(self, value: str):
        username = value.strip()
        if not username:
            raise serializers.ValidationError("Username is required.")
        if User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError("User with this username already exists.")
        return username

    def validate_password(self, value: str):
        validate_password(value)
        return value

    def validate_restaurant_id(self, value: int):
        if not Restaurant.objects.filter(id=value).exists():
            raise serializers.ValidationError("Restaurant not found.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        username = validated_data["username"].strip()
        password = validated_data["password"]
        restaurant = Restaurant.objects.get(id=validated_data["restaurant_id"])

        user = User(
            username=username,
            first_name=validated_data.get("first_name", "").strip(),
            last_name=validated_data.get("last_name", "").strip(),
            is_active=validated_data.get("is_active", True),
        )

        # если поле email существует в модели, просто оставляем пустым
        if hasattr(user, "email"):
            user.email = ""

        user.set_password(password)
        user.save()

        if hasattr(user, "restaurant"):
            user.restaurant = restaurant
            user.save(update_fields=["restaurant"])

        if hasattr(restaurant, "active") and not restaurant.active:
            restaurant.active = True
            restaurant.save(update_fields=["active"])

        subscription, _created = Subscription.objects.get_or_create(
            restaurant=restaurant,
            defaults={
                "plan": "trial",
                "status": "active",
            },
        )

        updated_fields = []

        if hasattr(subscription, "status") and subscription.status != "active":
            subscription.status = "active"
            updated_fields.append("status")

        if hasattr(subscription, "plan") and not getattr(subscription, "plan", None):
            subscription.plan = "trial"
            updated_fields.append("plan")

        if updated_fields:
            subscription.save(update_fields=updated_fields)

        return user

class SuperAdminBusinessUserPatchSerializer(serializers.Serializer):
    """
    Для toggle active.
    """
    is_active = serializers.BooleanField()


class SuperAdminResetPasswordSerializer(serializers.Serializer):
    """
    Сериализатор для reset-password.
    """
    user_id = serializers.IntegerField()
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)

    def validate_user_id(self, value: int):
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError("User not found.")
        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        validate_password(attrs["new_password"])
        return attrs

    def save(self, **kwargs):
        user = User.objects.get(id=self.validated_data["user_id"])
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user


# -------------------------
# Subscriptions
# -------------------------

class SuperAdminSubscriptionSerializer(serializers.ModelSerializer):
    restaurant = serializers.SerializerMethodField()

    class Meta:
        model = Subscription
        fields = [
            "id",
            "restaurant",
            "plan",
            "status",
            "paid_until",
            "created_at",
            "updated_at",
        ]

    def get_restaurant(self, obj):
        r = getattr(obj, "restaurant", None)
        if not r:
            return None
        return {
            "id": getattr(r, "id", None),
            "name": getattr(r, "name", None),
            "slug": getattr(r, "slug", None),
        }


class SuperAdminSubscriptionPatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = [
            "plan",
            "status",
        ]


# -------------------------
# Payments
# -------------------------

# -------------------------
# Payments (optional)
# -------------------------

if Payment:
    class SuperAdminPaymentSerializer(serializers.ModelSerializer):
        subscription_id = serializers.IntegerField(source="subscription.id", read_only=True)
        restaurant = serializers.SerializerMethodField()

        class Meta:
            model = Payment
            fields = [
                "id",
                "subscription_id",
                "restaurant",
                "amount",
                "currency",
                "provider",
                "status",
                "paid_at",
                "created_at",
            ]

        def get_restaurant(self, obj):
            sub = getattr(obj, "subscription", None)
            r = getattr(sub, "restaurant", None) if sub else None
            if not r:
                return None
            return {"id": r.id, "name": r.name, "slug": r.slug}
else:
    # чтобы import из views не падал, но serializer явно "заглушка"
    class SuperAdminPaymentSerializer(serializers.Serializer):
        detail = serializers.CharField(read_only=True, default="Payment model is not implemented")