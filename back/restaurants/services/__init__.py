# restaurants/services/unsorted.py
from django.db import transaction
from restaurants.models import Category  # поправь путь, если Category в другом app

UNSORTED_NAME = "Unsorted"

@transaction.atomic
def get_unsorted_category(restaurant):
    """
    Returns system 'Unsorted' category for a restaurant (creates if missing).
    """
    category, _ = Category.objects.get_or_create(
        restaurant=restaurant,
        is_system=True,
        defaults={"name": UNSORTED_NAME},
    )
    return category