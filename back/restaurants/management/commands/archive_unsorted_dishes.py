from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction

from restaurants.models import Dish


class Command(BaseCommand):
    help = "Archive dishes that have been in Unsorted (system category) for 30+ days."

    def add_arguments(self, parser):
        parser.add_argument(
            "--days",
            type=int,
            default=30,
            help="Archive dishes moved to Unsorted more than N days ago (default: 30).",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Do not update anything, just print how many dishes would be archived.",
        )

    def handle(self, *args, **options):
        days = options["days"]
        dry_run = options["dry_run"]

        now = timezone.now()
        cutoff = now - timedelta(days=days)

        qs = Dish.objects.filter(
            category__is_system=True,
            archived_at__isnull=True,
            moved_to_unsorted_at__isnull=False,
            moved_to_unsorted_at__lte=cutoff,
        )

        count = qs.count()

        if dry_run:
            self.stdout.write(self.style.WARNING(f"[DRY RUN] Would archive: {count} dish(es) (days={days})."))
            return

        if count == 0:
            self.stdout.write(self.style.SUCCESS("Nothing to archive."))
            return

        with transaction.atomic():
            updated = qs.update(archived_at=now)

        self.stdout.write(self.style.SUCCESS(f"Archived: {updated} dish(es) (days={days})."))