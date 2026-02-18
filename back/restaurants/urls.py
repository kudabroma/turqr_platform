from django.urls import path
from rest_framework.routers import DefaultRouter

from .views_public import (
    PublicRestaurantView,
    PublicMenuView,
    PublicRestaurantBySubdomainView,
    PublicMenuBySubdomainView,
)

from .views import (
    RegistrationView,
    LoginView,
    LogoutView,
    CategoryViewSet,
    DishViewSet,
    PaymentHistoryViewSet,
    MenuView,
    SubscriptionView,
    MeView,
    RestaurantMeView,   # ✅ ВАЖНО: импорт отсюда
)

router = DefaultRouter()
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"dishes", DishViewSet, basename="dish")
router.register(r"payments", PaymentHistoryViewSet, basename="payment")

urlpatterns = [
    # Public endpoints
    path("public/restaurants/<slug:slug>/", PublicRestaurantView.as_view(), name="public-restaurant"),
    path("public/restaurants/<slug:slug>/menu/", PublicMenuView.as_view(), name="public-menu"),

    path("public/restaurant/", PublicRestaurantBySubdomainView.as_view(), name="public-restaurant-subdomain"),
    path("public/menu/", PublicMenuBySubdomainView.as_view(), name="public-menu-subdomain"),

    # Auth
    path("auth/register/", RegistrationView.as_view(), name="auth-register"),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/me/", MeView.as_view(), name="auth-me"),

    # Business (admin)
    path("menu/", MenuView.as_view(), name="menu"),
    path("subscription/", SubscriptionView.as_view(), name="subscription"),
    path("restaurants/me/", RestaurantMeView.as_view(), name="restaurant-me"),
]

urlpatterns += router.urls
