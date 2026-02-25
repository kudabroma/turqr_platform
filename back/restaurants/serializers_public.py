from rest_framework import serializers
from .models import Restaurant, Category, Dish


class PublicRestaurantSerializer(serializers.ModelSerializer):
    contacts = serializers.SerializerMethodField()
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = Restaurant
        fields = [
            "slug",
            "name",
            "logo",
            "logo_url",   # ✅ добавили
            "phone",
            "email",
            "address",
            "contacts",
        ]

    def get_logo_url(self, obj: Restaurant):
        request = self.context.get("request")
        logo = getattr(obj, "logo", None)
        if not logo:
            return None
        try:
            url = logo.url
        except Exception:
            return None
        return request.build_absolute_uri(url) if request else url

    def get_contacts(self, obj):
        """
        Backward compatibility:
        - если есть новые поля → собираем contacts из них
        - если нет → возвращаем legacy contacts
        """
        parts = []

        if (obj.email or "").strip():
            parts.append(obj.email.strip())

        if (obj.phone or "").strip():
            parts.append(obj.phone.strip())

        if (obj.address or "").strip():
            parts.append(obj.address.strip())

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