# restaurants/superadmin_urls.py
from django.urls import path

from .superadmin_views import (
    SuperAdminBusinessUserDetailView,
    SuperAdminBusinessUserListCreateView,
    SuperAdminBusinessUserResetPasswordView,
    SuperAdminBusinessUserToggleActiveView,
    SuperAdminRestaurantDetailView,
    SuperAdminRestaurantExtendSubscriptionView,
    SuperAdminRestaurantListCreateView,
    SuperAdminRestaurantToggleActiveView,
)

urlpatterns = [
    # Restaurants
    path("restaurants/", SuperAdminRestaurantListCreateView.as_view(), name="sa-restaurants"),
    path("restaurants/<int:pk>/", SuperAdminRestaurantDetailView.as_view(), name="sa-restaurant-detail"),
    path("restaurants/<int:pk>/toggle-active/", SuperAdminRestaurantToggleActiveView.as_view(), name="sa-restaurant-toggle-active"),
    path("restaurants/<int:pk>/extend-subscription/", SuperAdminRestaurantExtendSubscriptionView.as_view(), name="sa-restaurant-extend-subscription"),

    # Business Users
    path("users/", SuperAdminBusinessUserListCreateView.as_view(), name="sa-users"),
    path("users/<int:pk>/", SuperAdminBusinessUserDetailView.as_view(), name="sa-user-detail"),
    path("users/<int:pk>/toggle-active/", SuperAdminBusinessUserToggleActiveView.as_view(), name="sa-user-toggle-active"),
    path("users/<int:pk>/reset-password/", SuperAdminBusinessUserResetPasswordView.as_view(), name="sa-user-reset-password"),
]