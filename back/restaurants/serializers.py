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

    logo_url = serializers.SerializerMethodField()
    photo1_url = serializers.SerializerMethodField()
    photo2_url = serializers.SerializerMethodField()
    photo3_url = serializers.SerializerMethodField()
    photo4_url = serializers.SerializerMethodField()
    photo5_url = serializers.SerializerMethodField()
    photo6_url = serializers.SerializerMethodField()

    # -------- compat subscription fields --------

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

    # -------- url helpers --------

    def _build_file_url(self, obj: Restaurant, field_name: str):
        """
        Возвращает абсолютный URL для ImageField/FileField.
        Если request нет — возвращает относительный.
        Если файла нет — None.
        """
        request = self.context.get("request")
        f = getattr(obj, field_name, None)
        if not f:
            return None
        try:
            url = f.url  # работает только для FileField/ImageField
        except Exception:
            return None
        return request.build_absolute_uri(url) if request else url

    def get_logo_url(self, obj: Restaurant):
        # ⚠️ будет работать только если logo = ImageField/FileField
        return self._build_file_url(obj, "logo")

    def get_photo1_url(self, obj: Restaurant): return self._build_file_url(obj, "photo1")
    def get_photo2_url(self, obj: Restaurant): return self._build_file_url(obj, "photo2")
    def get_photo3_url(self, obj: Restaurant): return self._build_file_url(obj, "photo3")
    def get_photo4_url(self, obj: Restaurant): return self._build_file_url(obj, "photo4")
    def get_photo5_url(self, obj: Restaurant): return self._build_file_url(obj, "photo5")
    def get_photo6_url(self, obj: Restaurant): return self._build_file_url(obj, "photo6")

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
            "logo_url",
            "front_template",
            # compat:
            "active",
            "plan",
            "paid_until",
            # photos:
            "photo1",
            "photo2",
            "photo3",
            "photo4",
            "photo5",
            "photo6",
            "photo1_url",
            "photo2_url",
            "photo3_url",
            "photo4_url",
            "photo5_url",
            "photo6_url",
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
            "contacts",
            "phone",
            "email",
            "address",
            "front_template",
            "logo",
            "photo1",
            "photo2",
            "photo3",
            "photo4",
            "photo5",
            "photo6",
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
# Categories (Business / Admin)
# =========================
class CategorySerializer(serializers.ModelSerializer):
    """
    Для business user: restaurant read-only, бек сам подставляет в perform_create.
    """
    restaurant = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "name_tr", "name_en", "restaurant", "is_system"]
        read_only_fields = ["id", "restaurant", "is_system"]

    def validate(self, attrs):
        # Backward compatibility:
        # если новый фронт шлёт name_tr, а старый name не шлёт -> заполним name
        name_tr = (attrs.get("name_tr") or "").strip()
        if name_tr and not (attrs.get("name") or "").strip():
            attrs["name"] = name_tr
        return attrs


class CategorySuperuserSerializer(serializers.ModelSerializer):
    """
    Для superuser: restaurant обязателен (он может создавать категории для любого ресторана).
    """
    restaurant = serializers.PrimaryKeyRelatedField(queryset=Restaurant.objects.all(), required=True)

    class Meta:
        model = Category
        fields = ["id", "name", "name_tr", "name_en", "restaurant", "is_system"]
        # is_system делаем read-only: системные категории создаём/контролим сервером
        read_only_fields = ["id", "is_system"]

    def validate(self, attrs):
        name_tr = (attrs.get("name_tr") or "").strip()
        if name_tr and not (attrs.get("name") or "").strip():
            attrs["name"] = name_tr
        return attrs


# =========================
# Dishes (Business / Admin)
# =========================
class DishSerializer(serializers.ModelSerializer):
    """
    Для business user: restaurant read-only (бек подставит).
    Также отдаём lifecycle поля read-only (для UI/фильтрации), но не даём менять напрямую.
    """

    restaurant = serializers.PrimaryKeyRelatedField(read_only=True)

    # ✅ URL для картинки блюда
    image_url = serializers.SerializerMethodField()

    def get_image_url(self, obj: Dish):
        request = self.context.get("request")
        image = getattr(obj, "image", None)
        if not image:
            return None
        try:
            url = image.url
        except Exception:
            return None
        return request.build_absolute_uri(url) if request else url

    class Meta:
        model = Dish
        fields = [
            "id",
            "name",
            "description",
            "name_tr",
            "name_en",
            "description_tr",
            "description_en",
            "price",
            "category",
            "restaurant",
            # ✅ image upload + url
            "image",
            "image_url",
            # lifecycle:
            "moved_to_unsorted_at",
            "archived_at",
        ]
        read_only_fields = ["id", "restaurant", "image_url", "moved_to_unsorted_at", "archived_at"]

    def validate(self, attrs):
        # Backward compatibility:
        # если новый фронт шлёт name_tr/description_tr, а legacy name/description не шлёт
        name_tr = (attrs.get("name_tr") or "").strip()
        if name_tr and not (attrs.get("name") or "").strip():
            attrs["name"] = name_tr

        # description может быть пустым, поэтому проверяем ключ
        if "description_tr" in attrs and "description" not in attrs:
            desc_tr = (attrs.get("description_tr") or "").strip()
            attrs["description"] = desc_tr

        return attrs


class DishSuperuserSerializer(serializers.ModelSerializer):
    restaurant = serializers.PrimaryKeyRelatedField(queryset=Restaurant.objects.all(), required=True)

    image_url = serializers.SerializerMethodField()

    def get_image_url(self, obj: Dish):
        request = self.context.get("request")
        image = getattr(obj, "image", None)
        if not image:
            return None
        try:
            url = image.url
        except Exception:
            return None
        return request.build_absolute_uri(url) if request else url

    class Meta:
        model = Dish
        fields = [
            "id",
            "name",
            "description",
            "name_tr",
            "name_en",
            "description_tr",
            "description_en",
            "price",
            "category",
            "restaurant",
            # ✅ image upload + url
            "image",
            "image_url",
            # lifecycle:
            "moved_to_unsorted_at",
            "archived_at",
        ]
        read_only_fields = ["id", "image_url", "moved_to_unsorted_at", "archived_at"]

    def validate(self, attrs):
        name_tr = (attrs.get("name_tr") or "").strip()
        if name_tr and not (attrs.get("name") or "").strip():
            attrs["name"] = name_tr

        if "description_tr" in attrs and "description" not in attrs:
            desc_tr = (attrs.get("description_tr") or "").strip()
            attrs["description"] = desc_tr

        return attrs


# =========================
# Menu Read (Business MenuView / tourists style)
# =========================
class DishReadSerializer(serializers.ModelSerializer):
    """
    Read-only вариант блюда без лишних технических полей.
    Используется в выдаче меню.
    """
    name = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    def _lang(self) -> str:
        lang = (self.context.get("lang") or "tr").lower()
        return "en" if lang.startswith("en") else "tr"

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
        request = self.context.get("request")
        image = getattr(obj, "image", None)
        if not image:
            return None
        try:
            url = image.url
        except Exception:
            return None
        return request.build_absolute_uri(url) if request else url

    class Meta:
        model = Dish
        fields = ["id", "name", "description", "price", "category", "image_url"]


class CategoryWithDishesSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    dishes = DishReadSerializer(many=True, read_only=True)

    def _lang(self) -> str:
        lang = (self.context.get("lang") or "tr").lower()
        return "en" if lang.startswith("en") else "tr"

    def get_name(self, obj: Category):
        lang = self._lang()
        if lang == "en":
            return (obj.name_en or "").strip() or (obj.name_tr or "").strip() or (obj.name or "").strip()
        return (obj.name_tr or "").strip() or (obj.name or "").strip() or (obj.name_en or "").strip()

    class Meta:
        model = Category
        fields = ["id", "name", "is_system", "dishes"]


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