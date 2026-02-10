from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import (
    Restaurant,
    User,
    Category,
    Dish,
    Subscription,
    PaymentHistory,
)


def _is_business_user(request):
    u = request.user
    return bool(
        getattr(u, "is_authenticated", False)
        and getattr(u, "is_staff", False)
        and not getattr(u, "is_superuser", False)
        and getattr(u, "restaurant", None) is not None
    )


@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    """
    Visible only to superusers (platform owners).
    """

    list_display = ("id", "name", "active", "plan", "paid_until", "contacts", "front_template", "created_at")
    list_editable = ("active", "plan", "paid_until")
    list_display_links = ("id", "name")
    search_fields = ("name",)
    list_filter = ("active", "plan", "created_at")

    def has_module_permission(self, request):
        return request.user.is_superuser

    def has_view_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_add_permission(self, request):
        return request.user.is_superuser

    def has_change_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    """
    Users management visible only to superusers. Business owners should not manage users in admin.
    """

    fieldsets = DjangoUserAdmin.fieldsets + ((_("Restaurant"), {"fields": ("restaurant",)}),)
    add_fieldsets = DjangoUserAdmin.add_fieldsets + ((_("Restaurant"), {"fields": ("restaurant",)}),)
    list_display = ("username", "email", "restaurant", "is_staff", "is_superuser")
    list_filter = ("restaurant", "is_staff", "is_superuser")

    def has_module_permission(self, request):
        return request.user.is_superuser

    def save_model(self, request, obj, form, change):
        # Ensure restaurant is saved when creating user via admin
        if not change:
            obj.is_staff = True
            # If admin add form provided a password field, ensure it's hashed
            pwd = None
            try:
                pwd = form.cleaned_data.get("password1") or form.cleaned_data.get("password")
            except Exception:
                pwd = None
            if pwd:
                obj.set_password(pwd)
            # Assign restaurant for business users just in case
            if _is_business_user(request):
                obj.restaurant = request.user.restaurant
        else:
            # For updates, if password appears to be raw (unlikely), hash it
            pw = getattr(obj, "password", "") or ""
            if pw and not pw.startswith(("pbkdf2_", "argon2$", "bcrypt_sha256$", "bcrypt$")):
                obj.set_password(pw)

        super().save_model(request, obj, form, change)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """
    Category admin for Business Owners only.

    Business owners (staff, non-superuser) can only see and edit categories for their own restaurant.
    Superusers do NOT see this admin.
    """

    list_display = ("name", "restaurant", "created_at")
    search_fields = ("name",)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            # hide from superuser per requirements
            return qs.none()
        if _is_business_user(request):
            return qs.filter(restaurant=request.user.restaurant)
        return qs.none()

    def has_module_permission(self, request):
        return _is_business_user(request)

    def has_view_permission(self, request, obj=None):
        if not _is_business_user(request):
            return False
        if obj is None:
            return True
        return obj.restaurant_id == request.user.restaurant_id

    def has_add_permission(self, request):
        return _is_business_user(request)

    def has_change_permission(self, request, obj=None):
        return self.has_view_permission(request, obj)

    def has_delete_permission(self, request, obj=None):
        return self.has_view_permission(request, obj)

    def get_exclude(self, request, obj=None):
        # hide restaurant field for business owners (it will be auto-assigned)
        if _is_business_user(request):
            return ("restaurant",)
        return super().get_exclude(request, obj)

    def save_model(self, request, obj, form, change):
        if _is_business_user(request):
            obj.restaurant = request.user.restaurant
        super().save_model(request, obj, form, change)


@admin.register(Dish)
class DishAdmin(admin.ModelAdmin):
    """
    Dish (MenuItem) admin for Business Owners only.
    """

    list_display = ("name", "price", "category", "restaurant", "created_at")
    list_filter = ("category",)
    search_fields = ("name",)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs.none()
        if _is_business_user(request):
            return qs.filter(restaurant=request.user.restaurant)
        return qs.none()

    def has_module_permission(self, request):
        return _is_business_user(request)

    def has_view_permission(self, request, obj=None):
        if not _is_business_user(request):
            return False
        if obj is None:
            return True
        return obj.restaurant_id == request.user.restaurant_id

    def has_add_permission(self, request):
        return _is_business_user(request)

    def has_change_permission(self, request, obj=None):
        return self.has_view_permission(request, obj)

    def has_delete_permission(self, request, obj=None):
        return self.has_view_permission(request, obj)

    def get_exclude(self, request, obj=None):
        if _is_business_user(request):
            return ("restaurant",)
        return super().get_exclude(request, obj)

    def save_model(self, request, obj, form, change):
        if _is_business_user(request):
            obj.restaurant = request.user.restaurant
        super().save_model(request, obj, form, change)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "category" and _is_business_user(request):
            kwargs["queryset"] = Category.objects.filter(restaurant=request.user.restaurant)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


# @admin.register(Subscription)  # Removed for simplified MVP subscription management
# class SubscriptionAdmin(admin.ModelAdmin):
#     """
#     Subscriptions visible only to superusers (platform owners).
#     """
#
#     list_display = (
#         "id",
#         "restaurant",
#         "tariff",
#         "status",
#         "started_at",
#         "expires_at",
#     )
#     list_filter = ("status", "tariff")
#
#     def has_module_permission(self, request):
#         return request.user.is_superuser
#
#     def has_view_permission(self, request, obj=None):
#         return request.user.is_superuser
#
#     def has_add_permission(self, request):
#         return request.user.is_superuser
#
#     def has_change_permission(self, request, obj=None):
#         return request.user.is_superuser
#
#     def has_delete_permission(self, request, obj=None):
#         return request.user.is_superuser


@admin.register(PaymentHistory)
class PaymentHistoryAdmin(admin.ModelAdmin):
    """
    Payment history accessible only to superusers.
    """

    list_display = (
        "id",
        "restaurant",
        "amount",
        "payment_method",
        "status",
        "paid_at",
    )
    list_filter = ("status", "payment_method", "restaurant")

    def has_module_permission(self, request):
        return request.user.is_superuser
