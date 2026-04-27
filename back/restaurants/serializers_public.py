from rest_framework import serializers
from .models import Restaurant, Category, Dish


class PublicRestaurantSerializer(serializers.ModelSerializer):
    contacts = serializers.SerializerMethodField()
    logo_url = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()

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
            "description",
            "logo",
            "logo_url",
            "phone",
            "email",
            "address",
            "working_hours",
            "contacts",
            "photo1_url",
            "photo2_url",
            "photo3_url",
            "photo4_url",
            "photo5_url",
            "photo6_url",
        ]

    def _lang(self) -> str:
        raw = self.context.get("lang")
        if not raw:
            request = self.context.get("request")
            raw = getattr(
                getattr(request, "query_params", None),
                "get",
                lambda _k, _d=None: None
            )("lang", None) if request else None

        lang = (raw or "tr").lower()
        if lang.startswith("en"):
            return "en"
        if lang.startswith("ru"):
            return "ru"
        return "tr"

    # ✅ возвращаем относительный URL
    def _file_url(self, file_field):
        if not file_field:
            return None
        try:
            return file_field.url
        except Exception:
            return None

    def get_logo_url(self, obj: Restaurant):
        return self._file_url(getattr(obj, "logo", None))

    def get_photo1_url(self, obj: Restaurant):
        return self._file_url(getattr(obj, "photo1", None))

    def get_photo2_url(self, obj: Restaurant):
        return self._file_url(getattr(obj, "photo2", None))

    def get_photo3_url(self, obj: Restaurant):
        return self._file_url(getattr(obj, "photo3", None))

    def get_photo4_url(self, obj: Restaurant):
        return self._file_url(getattr(obj, "photo4", None))

    def get_photo5_url(self, obj: Restaurant):
        return self._file_url(getattr(obj, "photo5", None))

    def get_photo6_url(self, obj: Restaurant):
        return self._file_url(getattr(obj, "photo6", None))

    def get_description(self, obj: Restaurant):
        lang = self._lang()

        desc_tr = (getattr(obj, "description_tr", "") or "").strip()
        desc_en = (getattr(obj, "description_en", "") or "").strip()

        if lang == "en":
            return desc_en or desc_tr
        return desc_tr or desc_en

    def get_contacts(self, obj: Restaurant):
        # ✅ сначала берем то, что ресторан реально ввел в поле contacts
        raw_contacts = (getattr(obj, "contacts", "") or "").strip()
        if raw_contacts:
            return raw_contacts

        # ✅ fallback только для старых ресторанов, где contacts пустой
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

        return "\n".join(parts)


class PublicDishSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Dish
        fields = [
            "id", "name", "description", "price", "image_url",
            "is_vegetarian", "is_vegan", "is_gluten_free", "is_spicy",
        ]

    def _lang(self) -> str:
        """
        Priority:
        1) explicit context["lang"] (when view passes it)
        2) request.query_params["lang"] (fallback)
        3) default "tr"
        """
        raw = self.context.get("lang")
        if not raw:
            request = self.context.get("request")
            raw = getattr(getattr(request, "query_params", None), "get", lambda _k, _d=None: None)("lang", None) if request else None

        lang = (raw or "tr").lower()
        if lang.startswith("en"):
            return "en"
        if lang.startswith("ru"):
            return "ru"  # на будущее
        return "tr"

    def get_name(self, obj: Dish):
        lang = self._lang()

        name_tr = (obj.name_tr or "").strip()
        name_en = (obj.name_en or "").strip()
        name_old = (getattr(obj, "name", "") or "").strip()

        if lang == "en":
            return name_en or name_tr or name_old
        # tr default
        return name_tr or name_old or name_en

    def get_description(self, obj: Dish):
        lang = self._lang()

        desc_tr = (obj.description_tr or "").strip()
        desc_en = (obj.description_en or "").strip()
        desc_old = (getattr(obj, "description", "") or "").strip()

        if lang == "en":
            return desc_en or desc_tr or desc_old
        return desc_tr or desc_old or desc_en

    def get_price(self, obj: Dish):
        # DecimalField -> string ok for frontend
        val = getattr(obj, "price", None)
        return str(val) if val is not None else "0"

    def get_image_url(self, obj: Dish):
        image = getattr(obj, "image", None)
        if not image:
            return None
        try:
            return image.url  # ✅ "/media/...."
        except Exception:
            return None


class PublicCategorySerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    dishes = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ("id", "name","sort_order", "dishes")

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