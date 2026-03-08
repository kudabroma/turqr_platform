from django.urls import path
from rest_framework.routers import DefaultRouter

from .views_public import (
    PublicRestaurantView,
    PublicMenuView,
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
    RestaurantMeView,
    AdminQrPngView,
    AdminQrTableStickerView,
)
from .lead_views import create_lead


router = DefaultRouter()
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"dishes", DishViewSet, basename="dish")
router.register(r"payments", PaymentHistoryViewSet, basename="payment")

urlpatterns = [
    # ✅ PUBLIC (tourists) — slug через query: ?slug=turko
    path("public/restaurant/", PublicRestaurantView.as_view(), name="public-restaurant"),
    path("public/menu/", PublicMenuView.as_view(), name="public-menu"),

    # Auth
    path("auth/register/", RegistrationView.as_view(), name="auth-register"),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/me/", MeView.as_view(), name="auth-me"),

    # Business (admin)
    path("menu/", MenuView.as_view(), name="menu"),
    path("subscription/", SubscriptionView.as_view(), name="subscription"),
    path("restaurants/me/", RestaurantMeView.as_view(), name="restaurant-me"),
    path("lead/", create_lead),

    # QR
    path("admin/qr/png/", AdminQrPngView.as_view()),
    path("admin/qr/table-sticker/", AdminQrTableStickerView.as_view()),
]

urlpatterns += router.urls