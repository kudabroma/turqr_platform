# permissions.py
from rest_framework import permissions


class HasActiveSubscriptionOrReadOnly(permissions.BasePermission):
    """
    READ (SAFE METHODS) allowed for authenticated business users (with restaurant),
    even if subscription is missing/inactive — useful for onboarding/dev.

    WRITE (POST/PUT/PATCH/DELETE) allowed only if subscription status is active or trial.
    Superusers bypass all checks.
    """

    message = "Subscription is required for this action."

    def has_permission(self, request, view):
        user = request.user

        if not getattr(user, "is_authenticated", False):
            return False

        if getattr(user, "is_superuser", False):
            return True

        restaurant = getattr(user, "restaurant", None)
        if not restaurant:
            return False  # нет ресторана — значит это не business user

        # ✅ чтение разрешаем, даже без подписки
        if request.method in permissions.SAFE_METHODS:
            return True

        # ❗️запись — только при активной/триал подписке
        subscription = getattr(restaurant, "subscription", None)
        if not subscription:
            return False

        return getattr(subscription, "status", None) in ("active", "trial")


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
