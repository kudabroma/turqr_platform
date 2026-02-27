# restaurants/superadmin_views.py
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import RetrieveUpdateDestroyAPIView
from .models import Restaurant



from .models import Restaurant
from .superadmin_serializers import (
    SuperAdminRestaurantSerializer,
    SuperAdminBusinessUserSerializer,
    SuperAdminBusinessUserCreateSerializer,
    SuperAdminBusinessUserPatchSerializer,
    SuperAdminResetPasswordSerializer,
)

User = get_user_model()


class IsSuperUser(permissions.BasePermission):
    message = "Superuser access required."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


# --- Restaurants (ты уже сделал, но оставляю пример) ---
class SuperAdminRestaurantListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsSuperUser]
    queryset = Restaurant.objects.all().order_by("-id")
    serializer_class = SuperAdminRestaurantSerializer

# --- DELETE beginning
class SuperAdminRestaurantDetailView(RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAdminUser]
    queryset = Restaurant.objects.all()
    serializer_class = SuperAdminRestaurantSerializer
# --- Users ---
class SuperAdminBusinessUserListCreateView(APIView):
    permission_classes = [IsSuperUser]

    def get(self, request):
        # business users = user.restaurant is not null (как у тебя в фронте)
        qs = User.objects.filter(restaurant__isnull=False).select_related("restaurant").order_by("-id")
        data = SuperAdminBusinessUserSerializer(qs, many=True).data
        return Response(data)

    def post(self, request):
        ser = SuperAdminBusinessUserCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = ser.save()
        return Response(SuperAdminBusinessUserSerializer(user).data, status=status.HTTP_201_CREATED)


class SuperAdminBusinessUserDetailView(generics.UpdateAPIView):
    permission_classes = [IsSuperUser]
    serializer_class = SuperAdminBusinessUserPatchSerializer
    queryset = User.objects.all()

    # PATCH /api/superadmin/users/{id}/
    http_method_names = ["patch"]


class SuperAdminBusinessUserResetPasswordView(APIView):
    permission_classes = [permissions.IsAdminUser]  # или твой IsSuperAdmin

    def post(self, request, pk: int):
        password = request.data.get("password")
        if not password or len(password) < 8:
            return Response(
                {"detail": "Password must be at least 8 characters."},
                status=status.HTTP_400_BAD_REQUEST
            )

        u = get_object_or_404(User, pk=pk)
        u.set_password(password)
        u.save(update_fields=["password"])
        return Response({"detail": "Password updated."}, status=status.HTTP_200_OK)
class SuperAdminBusinessUserToggleActiveView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def patch(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        user.is_active = not user.is_active
        user.save(update_fields=["is_active"])
        return Response({"id": user.id, "is_active": user.is_active})
class SuperAdminRestaurantToggleActiveView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def patch(self, request, pk):
        restaurant = get_object_or_404(Restaurant, pk=pk)

        restaurant.active = not restaurant.active
        restaurant.save(update_fields=["active"])

        return Response({
            "id": restaurant.id,
            "active": restaurant.active,
        })