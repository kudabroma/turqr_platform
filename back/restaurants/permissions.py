# permissions.py
from rest_framework import permissions
from rest_framework.permissions import BasePermission, SAFE_METHODS


class HasActiveSubscriptionOrReadOnly(BasePermission):
    message = "Subscription is required for this action."

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        if user.is_superuser:
            return True

        if request.method in SAFE_METHODS:
            return True

        restaurant = getattr(user, "restaurant", None)
        if not restaurant:
            return False

        subscription = getattr(restaurant, "subscription", None)
        if not subscription:
            return False

        return subscription.is_active()


# Если хочешь оставить старую строгую проверку (вдруг используется где-то ещё)
class HasActiveSubscription(permissions.BasePermission):
    """
    Strict: любые методы требуют active/trial.
    Superusers bypass.
    """

    message = "Active subscription is required."

    def has_permission(self, request, view):
        user = request.user

        if not getattr(user, "is_authenticated", False):
            return False

        if getattr(user, "is_superuser", False):
            return True

        restaurant = getattr(user, "restaurant", None)
        if not restaurant:
            return False

        subscription = getattr(restaurant, "subscription", None)
        if not subscription:
            return False

        return getattr(subscription, "status", None) in ("active", "trial")
