from django.urls import path, include
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
)

router = DefaultRouter()
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"dishes", DishViewSet, basename="dish")
router.register(r"payments", PaymentHistoryViewSet, basename="payment")

urlpatterns = [
    path("public/restaurants/<slug:slug>/", PublicRestaurantView.as_view(),name="public-restaurant"),
    path("public/restaurants/<slug:slug>/menu/", PublicMenuView.as_view(), name="public-menu"),
    
    path("public/restaurant/", PublicRestaurantBySubdomainView.as_view()),
    path("public/menu/", PublicMenuBySubdomainView.as_view()),

    # Аутентификация
    path("auth/register/", RegistrationView.as_view(), name="auth-register"),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),

    # Меню и подписка
    path("menu/", MenuView.as_view(), name="menu"),
    path("subscription/", SubscriptionView.as_view(), name="subscription"),

    # Public API endpoints

]
urlpatterns += router.urls


