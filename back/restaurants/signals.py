from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta

from .models import Restaurant, Subscription


@receiver(post_save, sender=Restaurant)
def ensure_subscription_exists(sender, instance, created, **kwargs):
    if created:
        Subscription.objects.get_or_create(
            restaurant=instance,
            defaults={
                "status": "trial",
                "tariff": "basic",
                "expires_at": timezone.now() + timedelta(days=14),
            },
        )