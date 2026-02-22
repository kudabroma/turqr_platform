# restaurants/management/commands/ensure_unsorted_categories.py
from django.core.management.base import BaseCommand
from django.db import transaction

from restaurants.models import Restaurant
from restaurants.services.unsorted import get_unsorted_category

class Command(BaseCommand):
    help = "Ensure each restaurant has a system Unsorted category."

    def handle(self, *args, **options):
        created_count = 0
        with transaction.atomic():
            for r in Restaurant.objects.all().iterator():
                # before_count = r.categories.filter(is_system=True).count()  # optional
                cat = get_unsorted_category(r)
                # we can detect creation by checking name match? not needed
                # but we can increment if it was newly created via a quick query:
                # (skip to keep it simple)
        self.stdout.write(self.style.SUCCESS("✅ Unsorted ensured for all restaurants."))