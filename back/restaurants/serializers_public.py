from rest_framework import serializers
from .models import Restaurant, Category, Dish


from rest_framework import serializers
from .models import Restaurant


class PublicRestaurantSerializer(serializers.ModelSerializer):
    contacts = serializers.SerializerMethodField()

    class Meta:
        model = Restaurant
        fields = [
            "slug",
            "name",
            "logo",
            "phone",
            "email",
            "address",
            "contacts",
        ]

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

    class Meta:
        model = Dish
        fields = ["id", "name", "price"]  # ← ВАЖНО: price здесь есть!

    def get_price(self, obj):
        for attr in ("price", "cost", "amount", "price_value", "price_try", "price_amount"):
            val = getattr(obj, attr, None)
            if val is not None and val != "":
                return str(val)
        return "0"


class PublicCategorySerializer(serializers.ModelSerializer):
    dishes = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ("id", "name", "dishes")

    def get_dishes(self, obj):
        qs = Dish.objects.filter(category=obj).order_by("id")
        return PublicDishSerializer(qs, many=True).data
