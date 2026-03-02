from rest_framework import serializers
from .models import Restaurant, Category, Dish


class PublicRestaurantSerializer(serializers.ModelSerializer):
    contacts = serializers.SerializerMethodField()
    logo_url = serializers.SerializerMethodField()

    photo1_url = serializers.SerializerMethodField()
    photo2_url = serializers.SerializerMethodField()
    photo3_url = serializers.SerializerMethodField()
    photo4_url = serializers.SerializerMethodField()
    photo5_url = serializers.SerializerMethodField()
    photo6_url = serializers.SerializerMethodField()

    class Meta:
        model = Restaurant
        fields = [
            "slug",
            "name",
            "logo",
            "logo_url",
            "phone",
            "email",
            "address",
            "contacts",
            "photo1_url",
            "photo2_url",
            "photo3_url",
            "photo4_url",
            "photo5_url",
            "photo6_url",
        ]

    def _file_url(self, file_field):
        if not file_field:
            return None
        try:
            url = file_field.url
        except Exception:
            return None

        request = self.context.get("request")
        return request.build_absolute_uri(url) if request else url

    def get_logo_url(self, obj: Restaurant):
        return self._file_url(getattr(obj, "logo", None))

    def get_photo1_url(self, obj: Restaurant): return self._file_url(getattr(obj, "photo1", None))
    def get_photo2_url(self, obj: Restaurant): return self._file_url(getattr(obj, "photo2", None))
    def get_photo3_url(self, obj: Restaurant): return self._file_url(getattr(obj, "photo3", None))
    def get_photo4_url(self, obj: Restaurant): return self._file_url(getattr(obj, "photo4", None))
    def get_photo5_url(self, obj: Restaurant): return self._file_url(getattr(obj, "photo5", None))
    def get_photo6_url(self, obj: Restaurant): return self._file_url(getattr(obj, "photo6", None))

    def get_contacts(self, obj: Restaurant):
        parts = []
        email = (obj.email or "").strip()
        phone = (obj.phone or "").strip()
        address = (obj.address or "").strip()

        if email:
            parts.append(email)
        if phone:
            parts.append(phone)
        if address:
            parts.append(address)

        if parts:
            return "\n".join(parts)

        return (obj.contacts or "").strip()


class PublicDishSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Dish
        fields = ["id", "name", "description", "price", "image_url"]

    def _lang(self) -> str:
        lang = (self.context.get("lang") or "tr").lower()
        if lang.startswith("en"):
            return "en"
        if lang.startswith("ru"):
            return "ru"  # на будущее
        return "tr"

    def get_name(self, obj: Dish):
        lang = self._lang()
        # сейчас у тебя есть tr/en, ru позже
        if lang == "en":
            return (obj.name_en or "").strip() or (obj.name_tr or "").strip() or (getattr(obj, "name", "") or "").strip()
        return (obj.name_tr or "").strip() or (getattr(obj, "name", "") or "").strip() or (obj.name_en or "").strip()

    def get_description(self, obj: Dish):
        lang = self._lang()
        if lang == "en":
            return (obj.description_en or "").strip() or (obj.description_tr or "").strip() or (getattr(obj, "description", "") or "").strip()
        return (obj.description_tr or "").strip() or (getattr(obj, "description", "") or "").strip() or (obj.description_en or "").strip()

    def get_price(self, obj: Dish):
        # если price DecimalField -> str ок
        val = getattr(obj, "price", None)
        return str(val) if val is not None else "0"

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


class PublicCategorySerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    dishes = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ("id", "name", "dishes")

    def _lang(self) -> str:
        lang = (self.context.get("lang") or "tr").lower()
        if lang.startswith("en"):
            return "en"
        if lang.startswith("ru"):
            return "ru"
        return "tr"

    def get_name(self, obj: Category):
        lang = self._lang()
        if lang == "en":
            return (obj.name_en or "").strip() or (obj.name_tr or "").strip() or (getattr(obj, "name", "") or "").strip()
        return (obj.name_tr or "").strip() or (getattr(obj, "name", "") or "").strip() or (obj.name_en or "").strip()

    def get_dishes(self, obj: Category):
        # ✅ важно: используем prefetched relation "dishes" (из get_public_categories_queryset)
        qs = getattr(obj, "dishes", None)
        if qs is None:
            return []
        return PublicDishSerializer(qs.all(), many=True, context=self.context).data