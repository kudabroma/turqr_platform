from django.contrib.auth import authenticate
from django.db import transaction
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework import permissions, serializers, status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Case, When, Value, IntegerField
from django.http import HttpResponse, FileResponse
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from .qr.generator import compose_qr_template, build_menu_url, generate_qr_png_bytes
from .models import Restaurant, Category, Dish, PaymentHistory
from .serializers import (
    UserSerializer,
    CategorySerializer,
    CategorySuperuserSerializer,
    DishSerializer,
    DishSuperuserSerializer,
    CategoryWithDishesSerializer,
    SubscriptionSerializer,
    PaymentHistorySerializer,
    RestaurantMeSerializer,
    RestaurantUpdateSerializer,
)
from .permissions import HasActiveSubscriptionOrReadOnly
from .services.unsorted import get_unsorted_category
from .services.ai_translate import translate_dish_description, translate_category_name, TranslationError

User = settings.AUTH_USER_MODEL
from django.contrib.auth import get_user_model
User = get_user_model()


# =====================
# Helpers
# =====================
def _get_user_restaurant(user):
    return getattr(user, "restaurant", None)


# =====================
# Restaurant: /api/restaurants/me/ (GET + PATCH)
# =====================
class RestaurantMeView(APIView):
    """
    GET  /api/restaurants/me/
    PATCH /api/restaurants/me/
    """

    permission_classes = [permissions.IsAuthenticated, HasActiveSubscriptionOrReadOnly]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        user = request.user

        if user.is_superuser:
            return Response(
                {"detail": "Superuser has no single restaurant."},
                status=status.HTTP_403_FORBIDDEN,
            )

        restaurant = _get_user_restaurant(user)
        if restaurant is None:
            return Response(
                {"detail": "User has no associated restaurant."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response(
            RestaurantMeSerializer(restaurant, context={"request": request}).data
        )

    def patch(self, request):
        import boto3
        import os
        import io
        import logging
        logger = logging.getLogger(__name__)

        user = request.user

        if user.is_superuser:
            return Response(
                {"detail": "Superuser cannot update restaurant here."},
                status=status.HTTP_403_FORBIDDEN,
            )

        restaurant = _get_user_restaurant(user)
        if restaurant is None:
            return Response(
                {"detail": "User has no associated restaurant."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Читаем файлы ДО save пока поток открыт
        files_data = {}
        for k, v in request.FILES.items():
            content = v.read()
            files_data[k] = (v.name, content)
            v.seek(0)

        serializer = RestaurantUpdateSerializer(
            restaurant,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        restaurant.refresh_from_db()

        # Загружаем файлы в R2 через boto3 ПОСЛЕ save
        if files_data:
            try:
                s3 = boto3.client(
                    's3',
                    endpoint_url=f"https://{os.environ.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com",
                    aws_access_key_id=os.environ.get('R2_ACCESS_KEY_ID'),
                    aws_secret_access_key=os.environ.get('R2_SECRET_ACCESS_KEY'),
                    region_name='auto',
                )
                for field_name, (filename, content) in files_data.items():
                    key = f"restaurants/photos/{filename}"
                    s3.upload_fileobj(io.BytesIO(content), 'turqr-media', key)
                    logger.warning(f"R2 RESTAURANT UPLOAD OK: {key}")
            except Exception as e:
                logger.warning(f"R2 RESTAURANT UPLOAD ERROR: {e}")

        return Response(
            RestaurantMeSerializer(restaurant, context={"request": request}).data
        )


# =====================
# Auth
# =====================
class RegistrationView(APIView):
    """
    POST /api/auth/register/
    {
        "username": "admin",
        "password": "secret123",
        "restaurant_name": "My Restaurant"
    }
    """

    permission_classes = [permissions.AllowAny]

    class InputSerializer(UserSerializer):
        restaurant_name = serializers.CharField(write_only=True, max_length=255)

        class Meta(UserSerializer.Meta):
            fields = ["id", "username", "password", "restaurant_name"]

    def post(self, request):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            restaurant = Restaurant.objects.create(
                name=serializer.validated_data["restaurant_name"]
            )

            get_unsorted_category(restaurant)

            user = User(
                username=serializer.validated_data["username"],
                restaurant=restaurant,
            )
            user.set_password(serializer.validated_data["password"])
            user.save()

        return Response(
            {"id": user.id, "username": user.username, "restaurant": restaurant.id},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response(
                {"detail": "Неверный логин или пароль."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "id": user.id,
            "username": user.username,
            "restaurant": getattr(user, "restaurant_id", None),
        })


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    """GET /api/auth/me/"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "restaurant": getattr(user, "restaurant_id", None),
        })


# =====================
# Categories CRUD
# =====================
class CategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, HasActiveSubscriptionOrReadOnly]

    def get_serializer_class(self):
        if self.request.user.is_superuser:
            return CategorySuperuserSerializer
        return CategorySerializer

    def get_queryset(self):
        user = self.request.user

        if user.is_superuser:
            return Category.objects.all().order_by("sort_order", "id")

        restaurant = _get_user_restaurant(user)
        if not restaurant:
            return Category.objects.none()

        return Category.objects.filter(
            restaurant=restaurant
        ).order_by("sort_order", "id")

    def perform_create(self, serializer):
        user = self.request.user

        if user.is_superuser:
            serializer.save()
            return

        restaurant = _get_user_restaurant(user)
        if not restaurant:
            raise ValidationError({"restaurant": "User has no associated restaurant."})

        last = Category.objects.filter(
            restaurant=restaurant,
            is_system=False
        ).order_by("-sort_order").first()

        next_order = (last.sort_order + 1) if last else 0

        serializer.save(restaurant=restaurant, sort_order=next_order)

    def perform_update(self, serializer):
        category = self.get_object()

        if category.is_system:
            raise ValidationError({"detail": "System category cannot be modified."})

        user = self.request.user

        if user.is_superuser:
            serializer.save()
            return

        restaurant = _get_user_restaurant(user)
        if not restaurant:
            raise ValidationError({"restaurant": "User has no associated restaurant."})

        serializer.save(restaurant=restaurant)

    def destroy(self, request, *args, **kwargs):
        category = self.get_object()

        if category.is_system:
            raise ValidationError({"detail": "System category cannot be deleted."})

        unsorted = get_unsorted_category(category.restaurant)
        now = timezone.now()

        Dish.objects.filter(category=category).update(
            category=unsorted,
            moved_to_unsorted_at=now,
        )

        category.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["post"])
    def reorder(self, request):
        restaurant = _get_user_restaurant(request.user)
        if not restaurant:
            raise ValidationError({"restaurant": "User has no associated restaurant."})

        items = request.data.get("items", [])

        for item in items:
            Category.objects.filter(
                id=item["id"],
                restaurant=restaurant,
                is_system=False
            ).update(sort_order=item["sort_order"])

        unsorted = Category.objects.filter(
            restaurant=restaurant,
            is_system=True
        ).first()

        if unsorted:
            last = Category.objects.filter(
                restaurant=restaurant,
                is_system=False
            ).order_by("-sort_order").first()

            unsorted.sort_order = (last.sort_order + 1) if last else 0
            unsorted.save()

        return Response({"status": "ok"})

    @action(detail=False, methods=["post"])
    def translate(self, request):
        """
        POST /api/categories/translate/
        Body: {"name_tr": "Başlangıçlar", "target_languages": ["ru", "en", ...]}
        Стейтлес — не привязан к конкретной категории, поэтому работает
        одинаково для новой (ещё не сохранённой) и уже существующей категории.
        Переводит имя через Anthropic Claude Haiku на указанные языки
        РЕСТОРАНА ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ (target_languages валидируется только
        против его собственного enabled_languages — restaurant_id из запроса
        не принимается). НЕ сохраняет — только возвращает переводы.
        """
        restaurant = _get_user_restaurant(request.user)
        if not restaurant:
            return Response(
                {"detail": "У пользователя нет привязанного ресторана."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        name_tr = (request.data.get("name_tr") or "").strip()
        if not name_tr:
            return Response(
                {"detail": "Укажите турецкое название категории (name_tr)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target_languages = request.data.get("target_languages")
        if not isinstance(target_languages, list) or not target_languages:
            return Response(
                {"detail": "Укажите список целевых языков (target_languages)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        enabled = set(restaurant.enabled_languages or [])
        valid_targets = [
            lang for lang in dict.fromkeys(target_languages)
            if lang in enabled and lang != "tr"
        ]
        if not valid_targets:
            return Response(
                {"detail": "Нет допустимых целевых языков (проверьте enabled_languages ресторана)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            translations = translate_category_name(name_tr, valid_targets)
        except TranslationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception:
            import logging
            logging.getLogger(__name__).exception("Unexpected AI translation error")
            return Response(
                {"detail": "Непредвиденная ошибка сервиса перевода."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({"translations": translations})


# =====================
# Dishes CRUD
# =====================
class DishViewSet(viewsets.ModelViewSet):
    """
    CRUD для блюд.
    Фото блюда (image) загружается через django-storages в R2 автоматически.
    """

    permission_classes = [permissions.IsAuthenticated, HasActiveSubscriptionOrReadOnly]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.request.user.is_superuser:
            return DishSuperuserSerializer
        return DishSerializer

    def get_queryset(self):
        user = self.request.user

        if getattr(user, "is_superuser", False):
            return Dish.objects.all()

        restaurant = getattr(user, "restaurant", None)
        if not restaurant:
            return Dish.objects.none()

        return Dish.objects.filter(restaurant=restaurant)

    def perform_create(self, serializer):
        import boto3
        import os
        import io
        import logging
        logger = logging.getLogger(__name__)

        # Читаем файлы ДО save
        files_data = {}
        for k, v in self.request.FILES.items():
            content = v.read()
            files_data[k] = (v.name, content)
            v.seek(0)

        user = self.request.user

        if user.is_superuser:
            restaurant = serializer.validated_data.get("restaurant")
            if restaurant is None:
                raise serializers.ValidationError({"restaurant": "This field is required."})
            saved = serializer.save(restaurant=restaurant)
        else:
            restaurant = _get_user_restaurant(user)
            if not restaurant:
                raise serializers.ValidationError({"restaurant": "User has no associated restaurant."})

            category = serializer.validated_data.get("category")
            if category and category.restaurant_id != restaurant.id:
                raise serializers.ValidationError({"category": "Category must belong to your restaurant."})

            saved = serializer.save(restaurant=restaurant)

        # Загружаем файлы в R2 после save
        if files_data:
            try:
                s3 = boto3.client(
                    's3',
                    endpoint_url=f"https://{os.environ.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com",
                    aws_access_key_id=os.environ.get('R2_ACCESS_KEY_ID'),
                    aws_secret_access_key=os.environ.get('R2_SECRET_ACCESS_KEY'),
                    region_name='auto',
                )
                for field_name, (filename, content) in files_data.items():
                    key = f"dishes/images/{filename}"
                    s3.upload_fileobj(io.BytesIO(content), 'turqr-media', key)
                    logger.warning(f"R2 CREATE UPLOAD OK: {key}")
            except Exception as e:
                logger.warning(f"R2 CREATE UPLOAD ERROR: {e}")

    def perform_update(self, serializer):
        import logging
        import boto3
        import os
        import io
        logger = logging.getLogger(__name__)

        # Читаем файлы ДО save пока поток открыт
        files_data = {}
        for k, v in self.request.FILES.items():
            content = v.read()
            files_data[k] = (v.name, content)
            v.seek(0)  # сбрасываем для serializer

        user = self.request.user
        instance = self.get_object()

        if user.is_superuser:
            old_category = instance.category
            saved = serializer.save()
            new_category = saved.category

            if old_category and old_category.is_system and new_category and not new_category.is_system:
                Dish.objects.filter(pk=saved.pk).update(moved_to_unsorted_at=None, archived_at=None)
            if new_category and new_category.is_system and saved.moved_to_unsorted_at is None:
                Dish.objects.filter(pk=saved.pk).update(moved_to_unsorted_at=timezone.now())

        else:
            restaurant = _get_user_restaurant(user)
            if not restaurant:
                raise serializers.ValidationError({"restaurant": "User has no associated restaurant."})
            if instance.restaurant_id != restaurant.id:
                raise serializers.ValidationError({"detail": "You cannot modify this dish."})

            new_category = serializer.validated_data.get("category")
            if new_category and new_category.restaurant_id != restaurant.id:
                raise serializers.ValidationError({"category": "Category must belong to your restaurant."})

            old_category = instance.category
            saved = serializer.save(restaurant=restaurant)
            new_category_final = saved.category

            if old_category and old_category.is_system and new_category_final and not new_category_final.is_system:
                Dish.objects.filter(pk=saved.pk).update(moved_to_unsorted_at=None, archived_at=None)
            if new_category_final and new_category_final.is_system and saved.moved_to_unsorted_at is None:
                Dish.objects.filter(pk=saved.pk).update(moved_to_unsorted_at=timezone.now())

        # Загружаем файлы в R2 через boto3 ПОСЛЕ save
        if files_data:
            try:
                s3 = boto3.client(
                    's3',
                    endpoint_url=f"https://{os.environ.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com",
                    aws_access_key_id=os.environ.get('R2_ACCESS_KEY_ID'),
                    aws_secret_access_key=os.environ.get('R2_SECRET_ACCESS_KEY'),
                    region_name='auto',
                )
                for field_name, (filename, content) in files_data.items():
                    key = f"dishes/images/{filename}"
                    s3.upload_fileobj(io.BytesIO(content), 'turqr-media', key)
                    logger.warning(f"R2 UPLOAD OK: {key}")
            except Exception as e:
                logger.warning(f"R2 UPLOAD ERROR: {e}")

    def perform_destroy(self, instance):
        user = self.request.user

        if user.is_superuser:
            instance.delete()
            return

        restaurant = _get_user_restaurant(user)
        if not restaurant:
            raise serializers.ValidationError({"restaurant": "User has no associated restaurant."})

        if instance.restaurant_id != restaurant.id:
            raise serializers.ValidationError({"detail": "You cannot delete this dish."})

        instance.delete()

    @action(detail=True, methods=["post"])
    def translate(self, request, pk=None):
        """
        POST /api/dishes/{id}/translate/
        Body: {"target_languages": ["ru", "en", "de", ...]}
        Переводит название (с учётом кулинарного контекста — устоявшиеся турецкие
        названия блюд не переводятся дословно) и описание блюда через Anthropic
        Claude Haiku на указанные языки ресторана. НЕ сохраняет результат — только
        возвращает переводы, ресторатор сам решает сохранять их или нет.
        """
        dish = self.get_object()
        restaurant = dish.restaurant

        target_languages = request.data.get("target_languages")
        if not isinstance(target_languages, list) or not target_languages:
            return Response(
                {"detail": "Укажите список целевых языков (target_languages)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        enabled = set(restaurant.enabled_languages or [])
        valid_targets = [
            lang for lang in dict.fromkeys(target_languages)
            if lang in enabled and lang != "tr"
        ]
        if not valid_targets:
            return Response(
                {"detail": "Нет допустимых целевых языков (проверьте enabled_languages ресторана)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        name_tr = (dish.name_i18n or {}).get("tr") or dish.name_tr or dish.name
        description_tr = (
            (dish.description_i18n or {}).get("tr")
            or dish.description_tr
            or dish.description
        )

        if not (description_tr or "").strip():
            return Response(
                {"detail": "У блюда нет турецкого описания для перевода."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            translations = translate_dish_description(name_tr, description_tr, valid_targets)
        except TranslationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception:
            import logging
            logging.getLogger(__name__).exception("Unexpected AI translation error")
            return Response(
                {"detail": "Непредвиденная ошибка сервиса перевода."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({"translations": translations})


# =====================
# Payment History (read-only)
# =====================
class PaymentHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PaymentHistorySerializer
    permission_classes = [permissions.IsAuthenticated, HasActiveSubscriptionOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        qs = PaymentHistory.objects.all().order_by("-paid_at")

        if user.is_superuser:
            return qs

        restaurant = _get_user_restaurant(user)
        if not restaurant:
            return PaymentHistory.objects.none()

        return qs.filter(restaurant=restaurant)


# =====================
# Menu (Public / Admin read)
# =====================
class MenuView(APIView):
    """
    GET /api/menu/
    Возвращает категории и блюда ресторана.
    Поддерживает ?lang=en (по умолчанию tr).
    """

    permission_classes = [permissions.IsAuthenticated, HasActiveSubscriptionOrReadOnly]

    def get(self, request):
        user = request.user

        if user.is_superuser and request.query_params.get("restaurant_id"):
            try:
                restaurant = Restaurant.objects.get(pk=request.query_params.get("restaurant_id"))
            except Restaurant.DoesNotExist:
                return Response(
                    {"detail": "Restaurant not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )
        else:
            restaurant = _get_user_restaurant(user)
            if restaurant is None:
                return Response(
                    {"detail": "User has no associated restaurant."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        lang = request.query_params.get("lang", "tr").lower()
        lang = "en" if lang.startswith("en") else "tr"

        categories = (
            Category.objects
            .filter(restaurant=restaurant)
            .annotate(
                _sys_last=Case(
                    When(is_system=True, then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField(),
                )
            )
            .order_by("_sys_last", "id")
            .prefetch_related("dishes")
        )

        serializer = CategoryWithDishesSerializer(
            categories,
            many=True,
            context={"request": request, "lang": lang},
        )
        return Response(serializer.data)


# =====================
# Subscription
# =====================
class SubscriptionView(APIView):
    """GET /api/subscription/"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.is_superuser:
            return Response(
                {"error": "Superusers cannot access subscription information."},
                status=status.HTTP_403_FORBIDDEN,
            )

        restaurant = _get_user_restaurant(user)
        if restaurant is None:
            return Response(
                {"error": "User has no associated restaurant."},
                status=status.HTTP_403_FORBIDDEN,
            )

        subscription = getattr(restaurant, "subscription", None)
        if not subscription:
            return Response(
                {"error": "Подписка не оформлена."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(SubscriptionSerializer(subscription).data)


# =====================
# QR Admin Endpoints
# =====================
class AdminQrPngView(APIView):
    """GET /api/admin/qr/png/"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        restaurant = getattr(request.user, "restaurant", None)

        if not restaurant:
            return Response(
                {"detail": "User has no restaurant."},
                status=status.HTTP_403_FORBIDDEN,
            )

        menu_url = build_menu_url(restaurant.slug)
        image = generate_qr_png_bytes(menu_url, size=512)

        response = HttpResponse(image.getvalue(), content_type="image/png")
        response["Content-Disposition"] = f'inline; filename="turqr-{restaurant.slug}-qr.png"'
        return response


class AdminQrTableStickerView(APIView):
    """GET /api/admin/qr/table-sticker/"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        restaurant = getattr(request.user, "restaurant", None)

        if not restaurant:
            return Response(
                {"detail": "User has no restaurant."},
                status=status.HTTP_403_FORBIDDEN,
            )

        image = compose_qr_template(restaurant.slug)

        response = HttpResponse(image.getvalue(), content_type="image/png")
        response["Content-Disposition"] = f'attachment; filename="turqr-{restaurant.slug}-sticker.png"'
        return response


class AdminQrMenuA5DownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        restaurant = request.user.restaurant
        slug = restaurant.slug

        file_obj = compose_qr_template(
            slug,
            "menu_a5_v2",
            restaurant_name=restaurant.name,
        )

        return FileResponse(
            file_obj,
            as_attachment=True,
            filename=f"{slug}_menu_a5.pdf",
            content_type="application/pdf",
        )
class DebugStorageView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        import os
        from django.conf import settings
        return Response({
            "USE_R2": os.getenv("USE_R2"),
            "DEFAULT_FILE_STORAGE": getattr(settings, "DEFAULT_FILE_STORAGE", None),
            "AWS_STORAGE_BUCKET_NAME": getattr(settings, "AWS_STORAGE_BUCKET_NAME", None),
            "AWS_S3_ENDPOINT_URL": getattr(settings, "AWS_S3_ENDPOINT_URL", None),
            "AWS_S3_CUSTOM_DOMAIN": getattr(settings, "AWS_S3_CUSTOM_DOMAIN", None),
            "R2_ACCOUNT_ID_set": bool(os.getenv("R2_ACCOUNT_ID")),
            "R2_ACCESS_KEY_set": bool(os.getenv("R2_ACCESS_KEY_ID")),
            "R2_SECRET_KEY_set": bool(os.getenv("R2_SECRET_ACCESS_KEY")),
        })