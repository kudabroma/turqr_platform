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
        """
        Возвращает абсолютный URL для FileField/ImageField.
        """
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

    def get_contacts(self, obj: Restaurant):
        """
        Backward compatibility:
        - если есть новые поля → собираем contacts из них
        - если нет → возвращаем legacy contacts
        """
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
    price = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Dish
        fields = ["id", "name", "price", "image_url"]  # ✅ добавили image_url

    def get_price(self, obj):
        for attr in ("price", "cost", "amount", "price_value", "price_try", "price_amount"):
            val = getattr(obj, attr, None)
            if val is not None and val != "":
                return str(val)
        return "0"

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
    dishes = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ("id", "name", "dishes")

    def get_dishes(self, obj):
        qs = Dish.objects.filter(category=obj).order_by("id")
        # ✅ важно: передадим context, чтобы build_absolute_uri работал
        return PublicDishSerializer(qs, many=True, context=self.context).data