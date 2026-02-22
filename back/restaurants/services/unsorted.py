from django.db import transaction
from restaurants.models import Category

UNSORTED_NAME = "Unsorted"

@transaction.atomic
def get_unsorted_category(restaurant):
    category, _ = Category.objects.get_or_create(
        restaurant=restaurant,
        is_system=True,
        defaults={"name": UNSORTED_NAME},
    )
    return category