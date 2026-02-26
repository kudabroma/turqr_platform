# restaurants/superadmin_urls.py
from django.urls import path

from .superadmin_views import (
    SuperAdminRestaurantListCreateView,
    SuperAdminBusinessUserListCreateView,
    SuperAdminBusinessUserDetailView,
    SuperAdminBusinessUserResetPasswordView,
    SuperAdminBusinessUserToggleActiveView,
    SuperAdminRestaurantDetailView
)

urlpatterns = [
    path("restaurants/", SuperAdminRestaurantListCreateView.as_view(), name="sa-restaurants"),

    path("users/", SuperAdminBusinessUserListCreateView.as_view(), name="sa-users"),

    # ✅ detail должен быть на /users/<id>/
    path("users/<int:pk>/", SuperAdminBusinessUserDetailView.as_view(), name="sa-user-detail"),

    # ✅ toggle-active отдельно
    path("users/<int:pk>/toggle-active/", SuperAdminBusinessUserToggleActiveView.as_view(), name="sa-user-toggle-active"),

    path("users/<int:pk>/reset-password/", SuperAdminBusinessUserResetPasswordView.as_view(), name="sa-user-reset-password"),
    path(
    "restaurants/<int:pk>/",
    SuperAdminRestaurantDetailView.as_view(),
    name="sa-restaurant-detail"
),
]