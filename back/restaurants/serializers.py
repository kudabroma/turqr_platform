from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Restaurant, Category, Dish, Subscription, PaymentHistory

User = get_user_model()

MEDIA_BASE = "https://media.turqr.com"


def _build_url(field_value) -> str | None:
    """
    Возвращает полный публичный URL файла.
    Если django-storages вернул относительный путь — добавляем домен.
    """
    if not field_value:
        return None
    try:
        url = field_value.url
        if not url:
            return None
        if url.startswith("/"):
            return f"{MEDIA_BASE}{url}"
        return url
    except Exception:
        return None


# =========================
# Restaurant: /api/restaurants/me/
# =========================
class RestaurantMeSerializer(serializers.ModelSerializer):
    active = serializers.SerializerMethodField()
    plan = serializers.SerializerMethodField()
    paid_until = serializers.SerializerMethodField()

    logo_url = serializers.SerializerMethodField()
    photo1_url = serializers.SerializerMethodField()
    photo2_url = serializers.SerializerMethodField()
    photo3_url = serializers.SerializerMethodField()
    photo4_url = serializers.SerializerMethodField()
    photo5_url = serializers.SerializerMethodField()
    photo6_url = serializers.SerializerMethodField()

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

    def get_logo_url(self, obj): return _build_url(obj.logo)
    def get_photo1_url(self, obj): return _build_url(obj.photo1)
    def get_photo2_url(self, obj): return _build_url(obj.photo2)
    def get_photo3_url(self, obj): return _build_url(obj.photo3)
    def get_photo4_url(self, obj): return _build_url(obj.photo4)
    def get_photo5_url(self, obj): return _build_url(obj.photo5)
    def get_photo6_url(self, obj): return _build_url(obj.photo6)

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
            "working_hours",
            "description_tr",
            "description_en",
            "logo",
            "logo_url",
            "front_template",
            "active",
            "plan",
            "paid_until",
            "photo1", "photo2", "photo3",
            "photo4", "photo5", "photo6",
            "photo1_url", "photo2_url", "photo3_url",
            "photo4_url", "photo5_url", "photo6_url",
        ]


class RestaurantUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Restaurant
        fields = [
            "name",
            "contacts",
            "phone",
            "email",
            "address",
            "working_hours",
            "description_tr",
            "description_en",
            "front_template",
            "logo",
            "photo1", "photo2", "photo3",
            "photo4", "photo5", "photo6",
        ]


# =========================
# Auth / Users
# =========================
class UserSerializer(serializers.ModelSerializer):
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
# Categories
# =========================
class CategorySerializer(serializers.ModelSerializer):
    restaurant = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "name_tr", "name_en", "restaurant", "is_system", "sort_order"]
        read_only_fields = ["id", "restaurant", "is_system", "sort_order"]
        extra_kwargs = {
            "name": {"required": False, "allow_blank": True},
            "name_tr": {"required": False, "allow_blank": True},
            "name_en": {"required": False, "allow_blank": True},
        }

    def validate(self, attrs):
        name = (attrs.get("name") or "").strip()
        name_tr = (attrs.get("name_tr") or "").strip()
        name_en = (attrs.get("name_en") or "").strip()

        if name_tr and not name:
            attrs["name"] = name_tr
            name = name_tr
        if name and not name_tr:
            attrs["name_tr"] = name

        final_name = (
            (attrs.get("name") or "").strip()
            or (attrs.get("name_tr") or "").strip()
            or name_en
        )
        if not final_name:
            raise serializers.ValidationError({"name": "Обязательное поле."})
        return attrs


class CategorySuperuserSerializer(serializers.ModelSerializer):
    restaurant = serializers.PrimaryKeyRelatedField(
        queryset=Restaurant.objects.all(), required=True
    )

    class Meta:
        model = Category
        fields = ["id", "name", "name_tr", "name_en", "restaurant", "is_system", "sort_order"]
        read_only_fields = ["id", "is_system", "sort_order"]
        extra_kwargs = {
            "name": {"required": False, "allow_blank": True},
            "name_tr": {"required": False, "allow_blank": True},
            "name_en": {"required": False, "allow_blank": True},
        }

    def validate(self, attrs):
        name = (attrs.get("name") or "").strip()
        name_tr = (attrs.get("name_tr") or "").strip()
        name_en = (attrs.get("name_en") or "").strip()

        if name_tr and not name:
            attrs["name"] = name_tr
            name = name_tr
        if name and not name_tr:
            attrs["name_tr"] = name

        final_name = (
            (attrs.get("name") or "").strip()
            or (attrs.get("name_tr") or "").strip()
            or name_en
        )
        if not final_name:
            raise serializers.ValidationError({"name": "Обязательное поле."})
        return attrs


# =========================
# Dishes
# =========================
class DishSerializer(serializers.ModelSerializer):
    """
    Business user.
    Фото блюда загружается через django-storages в R2 автоматически.
    image_url возвращает полный публичный URL.
    """
    restaurant = serializers.PrimaryKeyRelatedField(read_only=True)
    image_url = serializers.SerializerMethodField()

    def get_image_url(self, obj: Dish):
        return _build_url(obj.image)

    class Meta:
        model = Dish
        fields = [
            "id",
            "name", "description",
            "name_tr", "name_en",
            "description_tr", "description_en",
            "price",
            "category",
            "restaurant",
            "is_active",
            "image",
            "image_url",
            "moved_to_unsorted_at",
            "archived_at",
        ]
        read_only_fields = ["id", "restaurant", "image_url", "moved_to_unsorted_at", "archived_at"]
        extra_kwargs = {
            "name": {"required": False, "allow_blank": True},
            "description": {"required": False, "allow_blank": True},
            "name_tr": {"required": False, "allow_blank": True},
            "name_en": {"required": False, "allow_blank": True},
            "description_tr": {"required": False, "allow_blank": True},
            "description_en": {"required": False, "allow_blank": True},
        }

    def validate(self, attrs):
        name = (attrs.get("name") or "").strip()
        name_tr = (attrs.get("name_tr") or "").strip()
        name_en = (attrs.get("name_en") or "").strip()
        desc_tr = (attrs.get("description_tr") or "").strip()
        desc = (attrs.get("description") or "").strip()

        if name_tr and not name:
            attrs["name"] = name_tr
            name = name_tr
        if name and not name_tr:
            attrs["name_tr"] = name

        if "description_tr" in attrs and "description" not in attrs:
            attrs["description"] = desc_tr
        if "description" in attrs and "description_tr" not in attrs:
            attrs["description_tr"] = desc

        final_name = (attrs.get("name") or "").strip() or (attrs.get("name_tr") or "").strip() or name_en
        if not final_name:
            raise serializers.ValidationError({"name": "Обязательное поле."})
        return attrs


class DishSuperuserSerializer(serializers.ModelSerializer):
    """
    Superuser: restaurant обязателен.
    Фото также через django-storages → R2.
    """
    restaurant = serializers.PrimaryKeyRelatedField(
        queryset=Restaurant.objects.all(), required=True
    )
    image_url = serializers.SerializerMethodField()

    def get_image_url(self, obj: Dish):
        return _build_url(obj.image)

    class Meta:
        model = Dish
        fields = [
            "id",
            "name", "description",
            "name_tr", "name_en",
            "description_tr", "description_en",
            "price",
            "category",
            "restaurant",
            "is_active",
            "image",
            "image_url",
            "moved_to_unsorted_at",
            "archived_at",
        ]
        read_only_fields = ["id", "image_url", "moved_to_unsorted_at", "archived_at"]
        extra_kwargs = {
            "name": {"required": False, "allow_blank": True},
            "description": {"required": False, "allow_blank": True},
            "name_tr": {"required": False, "allow_blank": True},
            "name_en": {"required": False, "allow_blank": True},
            "description_tr": {"required": False, "allow_blank": True},
            "description_en": {"required": False, "allow_blank": True},
        }

    def validate(self, attrs):
        name = (attrs.get("name") or "").strip()
        name_tr = (attrs.get("name_tr") or "").strip()
        name_en = (attrs.get("name_en") or "").strip()
        desc_tr = (attrs.get("description_tr") or "").strip()
        desc = (attrs.get("description") or "").strip()

        if name_tr and not name:
            attrs["name"] = name_tr
            name = name_tr
        if name and not name_tr:
            attrs["name_tr"] = name

        if "description_tr" in attrs and "description" not in attrs:
            attrs["description"] = desc_tr
        if "description" in attrs and "description_tr" not in attrs:
            attrs["description_tr"] = desc

        final_name = (attrs.get("name") or "").strip() or (attrs.get("name_tr") or "").strip() or name_en
        if not final_name:
            raise serializers.ValidationError({"name": "Обязательное поле."})
        return attrs


# =========================
# Menu Read (public/admin read-only)
# =========================
class DishReadSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    def _lang(self) -> str:
        raw = (self.context.get("lang") or "tr").lower()
        return "en" if raw.startswith("en") else "tr"

    def get_name(self, obj: Dish):
        lang = self._lang()
        if lang == "en":
            return (obj.name_en or "").strip() or (obj.name_tr or "").strip() or (obj.name or "").strip()
        return (obj.name_tr or "").strip() or (obj.name or "").strip() or (obj.name_en or "").strip()

    def get_description(self, obj: Dish):
        lang = self._lang()
        if lang == "en":
            return (obj.description_en or "").strip() or (obj.description_tr or "").strip() or (obj.description or "").strip()
        return (obj.description_tr or "").strip() or (obj.description or "").strip() or (obj.description_en or "").strip()

    def get_image_url(self, obj: Dish):
        return _build_url(obj.image)

    class Meta:
        model = Dish
        fields = ["id", "name", "description", "price", "category", "image_url", "is_active"]


class CategoryWithDishesSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    dishes = DishReadSerializer(many=True, read_only=True)

    def _lang(self) -> str:
        raw = (self.context.get("lang") or "tr").lower()
        return "en" if raw.startswith("en") else "tr"

    def get_name(self, obj: Category):
        lang = self._lang()
        if lang == "en":
            return (obj.name_en or "").strip() or (obj.name_tr or "").strip() or (obj.name or "").strip()
        return (obj.name_tr or "").strip() or (obj.name or "").strip() or (obj.name_en or "").strip()

    class Meta:
        model = Category
        fields = ["id", "name", "is_system", "sort_order", "dishes"]


# =========================
# Subscription / Payments
# =========================
class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = ["tariff", "status", "started_at", "expires_at"]


class PaymentHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentHistory
        fields = ["id", "amount", "paid_at", "payment_method", "status"]