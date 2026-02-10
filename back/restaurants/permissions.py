from rest_framework import permissions


class HasActiveSubscription(permissions.BasePermission):
    """
    Permission that allows access only to users whose restaurant has an active or trial subscription.
    Superusers bypass this check.
    """

    def has_permission(self, request, view):
        user = request.user
        # Allow non-authenticated handlers to be handled by other permissions
        if not getattr(user, "is_authenticated", False):
            return False

        if user.is_superuser:
            return True

        restaurant = getattr(user, "restaurant", None)
        if not restaurant:
            return False

        subscription = getattr(restaurant, "subscription", None)
        if not subscription:
            return False

        return subscription.status in ("active", "trial")

