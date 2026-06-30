# restaurants/superadmin_views.py
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.generics import RetrieveUpdateDestroyAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Restaurant, Subscription
from .superadmin_serializers import (
    SuperAdminBusinessUserCreateSerializer,
    SuperAdminBusinessUserPatchSerializer,
    SuperAdminBusinessUserSerializer,
    SuperAdminResetPasswordSerializer,
    SuperAdminRestaurantCreateSerializer,
    SuperAdminRestaurantSerializer,
    SuperAdminRestaurantUpdateSerializer,
)

User = get_user_model()


class IsSuperUser(permissions.BasePermission):
    message = "Superuser access required."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_superuser
        )


# --- Restaurants ---

class SuperAdminRestaurantListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsSuperUser]
    queryset = Restaurant.objects.all().order_by("-id")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return SuperAdminRestaurantCreateSerializer
        return SuperAdminRestaurantSerializer

    def create(self, request, *args, **kwargs):
        ser = SuperAdminRestaurantCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        restaurant = ser.save()
        out = SuperAdminRestaurantSerializer(restaurant)
        return Response(out.data, status=status.HTTP_201_CREATED)


class SuperAdminRestaurantDetailView(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsSuperUser]
    queryset = Restaurant.objects.all()

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return SuperAdminRestaurantUpdateSerializer
        return SuperAdminRestaurantSerializer


class SuperAdminRestaurantToggleActiveView(APIView):
    permission_classes = [IsSuperUser]

    def patch(self, request, pk):
        restaurant = get_object_or_404(Restaurant, pk=pk)
        # поддержка разных имён поля
        for field in ("active", "is_active", "enabled"):
            if hasattr(restaurant, field):
                setattr(restaurant, field, not getattr(restaurant, field))
                restaurant.save(update_fields=[field])
                return Response({"id": restaurant.id, field: getattr(restaurant, field)})
        return Response(
            {"detail": "No active field found on Restaurant model."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


class SuperAdminRestaurantExtendSubscriptionView(APIView):
    permission_classes = [IsSuperUser]

    def post(self, request, pk):
        restaurant = get_object_or_404(Restaurant, pk=pk)

        days = request.data.get("days")
        try:
            days = int(days)
            if days < 1:
                raise ValueError
        except (TypeError, ValueError):
            return Response(
                {"detail": "days must be a positive integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        sub, created = Subscription.objects.get_or_create(
            restaurant=restaurant,
            defaults={"plan": "trial", "status": "active"},
        )

        # определяем поле с датой окончания
        expires_field = None
        for field in ("expires_at", "paid_until", "valid_until", "end_date"):
            if hasattr(sub, field):
                expires_field = field
                break

        if expires_field is None:
            return Response(
                {"detail": "Cannot determine expiry date field on Subscription."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        current = getattr(sub, expires_field)
        base = current if (current and current > timezone.now()) else timezone.now()
        setattr(sub, expires_field, base + timedelta(days=days))

        update_fields = [expires_field]
        if hasattr(sub, "status") and sub.status != "active":
            sub.status = "active"
            update_fields.append("status")

        sub.save(update_fields=update_fields)

        out = SuperAdminRestaurantSerializer(restaurant)
        return Response(out.data, status=status.HTTP_200_OK)


# --- Business Users ---

class SuperAdminBusinessUserListCreateView(APIView):
    permission_classes = [IsSuperUser]

    def get(self, request):
        qs = (
            User.objects.filter(restaurant__isnull=False)
            .select_related("restaurant")
            .order_by("-id")
        )
        data = SuperAdminBusinessUserSerializer(qs, many=True).data
        return Response(data)

    def post(self, request):
        ser = SuperAdminBusinessUserCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = ser.save()
        return Response(
            SuperAdminBusinessUserSerializer(user).data,
            status=status.HTTP_201_CREATED,
        )


class SuperAdminBusinessUserDetailView(generics.UpdateAPIView):
    permission_classes = [IsSuperUser]
    serializer_class = SuperAdminBusinessUserPatchSerializer
    queryset = User.objects.all()
    http_method_names = ["patch"]


class SuperAdminBusinessUserResetPasswordView(APIView):
    permission_classes = [IsSuperUser]

    def post(self, request, pk: int):
        password = request.data.get("password", "")
        if not password or len(password) < 8:
            return Response(
                {"detail": "Password must be at least 8 characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = get_object_or_404(User, pk=pk)
        user.set_password(password)
        user.save(update_fields=["password"])
        return Response({"detail": "Password updated."}, status=status.HTTP_200_OK)


class SuperAdminBusinessUserToggleActiveView(APIView):
    permission_classes = [IsSuperUser]

    def patch(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        user.is_active = not user.is_active
        user.save(update_fields=["is_active"])
        return Response({"id": user.id, "is_active": user.is_active})