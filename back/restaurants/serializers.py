from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Restaurant, Category, Dish, Subscription, PaymentHistory

User = get_user_model()


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
    # ✅ ВАЖНО: возвращаем относительный URL (/media/...), чтобы работало через ngrok и на телефоне

    def _file_url(self, obj: Restaurant, field_name: str):
        f = getattr(obj, field_name, None)
        if not f:
            return None
        try:
            return f.url  # ✅ "/media/...."
        except Exception:
            return None

    def get_logo_url(self, obj: Restaurant):
        return self._file_url(obj, "logo")

    def get_photo1_url(self, obj: Restaurant): return self._file_url(obj, "photo1")
    def get_photo2_url(self, obj: Restaurant): return self._file_url(obj, "photo2")
    def get_photo3_url(self, obj: Restaurant): return self._file_url(obj, "photo3")
    def get_photo4_url(self, obj: Restaurant): return self._file_url(obj, "photo4")
    def get_photo5_url(self, obj: Restaurant): return self._file_url(obj, "photo5")
    def get_photo6_url(self, obj: Restaurant): return self._file_url(obj, "photo6")

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
            "working_hours",
            # ✅ NEW bilingual fields
            "description_tr",
            "description_en",

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
    Business user: restaurant read-only, бек сам подставляет в perform_create.
    Разрешаем создавать/обновлять через name_tr без обязательного legacy name.
    """
    restaurant = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "name_tr", "name_en", "restaurant", "is_system"]
        read_only_fields = ["id", "restaurant", "is_system"]
        extra_kwargs = {
            # ✅ ключевое: legacy name больше не обязателен
            "name": {"required": False, "allow_blank": True},
            "name_tr": {"required": False, "allow_blank": True},
            "name_en": {"required": False, "allow_blank": True},
        }

    def validate(self, attrs):
        name = (attrs.get("name") or "").strip()
        name_tr = (attrs.get("name_tr") or "").strip()
        name_en = (attrs.get("name_en") or "").strip()

        # ✅ new -> legacy
        if name_tr and not name:
            attrs["name"] = name
            attrs["name"] = name_tr
            name = name_tr

        # ✅ legacy -> new (чтобы не пустовало)
        if name and not name_tr:
            attrs["name_tr"] = name

        # ✅ финальная проверка: должно быть хоть одно имя
        final_name = (attrs.get("name") or "").strip() or (attrs.get("name_tr") or "").strip() or name_en
        if not final_name:
            raise serializers.ValidationError({"name": "Обязательное поле."})

        return attrs


class CategorySuperuserSerializer(serializers.ModelSerializer):
    """
    Superuser: restaurant обязателен.
    """
    restaurant = serializers.PrimaryKeyRelatedField(queryset=Restaurant.objects.all(), required=True)

    class Meta:
        model = Category
        fields = ["id", "name", "name_tr", "name_en", "restaurant", "is_system"]
        read_only_fields = ["id", "is_system"]
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

        final_name = (attrs.get("name") or "").strip() or (attrs.get("name_tr") or "").strip() or name_en
        if not final_name:
            raise serializers.ValidationError({"name": "Обязательное поле."})

        return attrs


# =========================
# Dishes (Business / Admin)
# =========================
class DishSerializer(serializers.ModelSerializer):
    """
    Business user: restaurant read-only (бек подставит).
    Разрешаем создавать/обновлять через name_tr/description_tr без обязательного name/description.
    """
    restaurant = serializers.PrimaryKeyRelatedField(read_only=True)
    image_url = serializers.SerializerMethodField()

    def get_image_url(self, obj: Dish):
        image = getattr(obj, "image", None)
        if not image:
            return None
        try:
            return image.url  # "/media/...."
        except Exception:
            return None

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
            "is_active",
            "image",
            "image_url",
            "moved_to_unsorted_at",
            "archived_at",
        ]
        read_only_fields = ["id", "restaurant", "image_url", "moved_to_unsorted_at", "archived_at"]

        # ✅ КЛЮЧЕВОЕ: legacy поля больше не обязательные
        extra_kwargs = {
            "name": {"required": False, "allow_blank": True},
            "description": {"required": False, "allow_blank": True},
            "name_tr": {"required": False, "allow_blank": True},
            "name_en": {"required": False, "allow_blank": True},
            "description_tr": {"required": False, "allow_blank": True},
            "description_en": {"required": False, "allow_blank": True},
        }

    def validate(self, attrs):
        # --- normalize ---
        name = (attrs.get("name") or "").strip()
        name_tr = (attrs.get("name_tr") or "").strip()
        name_en = (attrs.get("name_en") or "").strip()

        desc = (attrs.get("description") or "").strip()
        desc_tr = (attrs.get("description_tr") or "").strip()
        desc_en = (attrs.get("description_en") or "").strip()

        # ✅ new -> legacy
        if name_tr and not name:
            attrs["name"] = name_tr
            name = name_tr

        # ✅ legacy -> new (чтобы не было пустых bilingual полей)
        if name and not name_tr:
            attrs["name_tr"] = name

        # ✅ description: new -> legacy
        if "description_tr" in attrs and "description" not in attrs:
            attrs["description"] = desc_tr

        # ✅ description: legacy -> new (если пришло legacy)
        if "description" in attrs and "description_tr" not in attrs:
            attrs["description_tr"] = desc

        # ✅ финальная проверка имени (должно быть хоть одно)
        final_name = (attrs.get("name") or "").strip() or (attrs.get("name_tr") or "").strip() or name_en
        if not final_name:
            raise serializers.ValidationError({"name": "Обязательное поле."})

        return attrs


class DishSuperuserSerializer(serializers.ModelSerializer):
    """
    Superuser может создавать блюда для любого ресторана (restaurant обязателен).
    """
    restaurant = serializers.PrimaryKeyRelatedField(queryset=Restaurant.objects.all(), required=True)
    image_url = serializers.SerializerMethodField()

    def get_image_url(self, obj: Dish):
        image = getattr(obj, "image", None)
        if not image:
            return None
        try:
            return image.url  # "/media/...."
        except Exception:
            return None

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
            "is_active",
            "image",
            "image_url",
            "moved_to_unsorted_at",
            "archived_at",
        ]
        read_only_fields = ["id", "image_url", "moved_to_unsorted_at", "archived_at"]

        # ✅ тоже делаем legacy поля необязательными
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

        desc = (attrs.get("description") or "").strip()
        desc_tr = (attrs.get("description_tr") or "").strip()

        # new -> legacy
        if name_tr and not name:
            attrs["name"] = name_tr
            name = name_tr

        # legacy -> new
        if name and not name_tr:
            attrs["name_tr"] = name

        # description new -> legacy
        if "description_tr" in attrs and "description" not in attrs:
            attrs["description"] = desc_tr

        # description legacy -> new
        if "description" in attrs and "description_tr" not in attrs:
            attrs["description_tr"] = desc

        # финальная проверка
        final_name = (attrs.get("name") or "").strip() or (attrs.get("name_tr") or "").strip() or name_en
        if not final_name:
            raise serializers.ValidationError({"name": "Обязательное поле."})

        return attrs


# =========================
# Menu Read (Admin menu read-only)
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
        image = getattr(obj, "image", None)
        if not image:
            return None
        try:
            return image.url  # "/media/...."
        except Exception:
            return None

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