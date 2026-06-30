from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class Restaurant(models.Model):
    """
    Ресторан, для которого создаётся QR-меню.
    """

    name = models.CharField(max_length=255, verbose_name="Название ресторана")
    slug = models.SlugField(
        max_length=255,
        unique=True,
        help_text="Используется в URL и поддомене ресторана",
    )
    active = models.BooleanField(default=True, db_index=True)

    # ✅ Двуязычное описание ресторана
    description_tr = models.TextField(blank=True, default="", verbose_name="Описание (TR)")
    description_en = models.TextField(blank=True, default="", verbose_name="Описание (EN)")
    description_ru = models.TextField(blank=True, default="", verbose_name="Описание (RU)")
    description_i18n = models.JSONField(default=dict, verbose_name="Описание (i18n JSON)")

    contacts = models.TextField(blank=True, verbose_name="Контакты")
    phone = models.CharField(max_length=50, blank=True, default="", verbose_name="Телефон")
    email = models.EmailField(blank=True, default="", verbose_name="Email")
    address = models.TextField(blank=True, default="", verbose_name="Адрес")

    working_hours = models.CharField(
        max_length=120,
        blank=True,
        default="",
        verbose_name="Часы работы"
    )

    # ✅ Фото ресторана
    photo1 = models.ImageField(upload_to="restaurants/photos/", null=True, blank=True)
    photo2 = models.ImageField(upload_to="restaurants/photos/", null=True, blank=True)
    photo3 = models.ImageField(upload_to="restaurants/photos/", null=True, blank=True)
    photo4 = models.ImageField(upload_to="restaurants/photos/", null=True, blank=True)
    photo5 = models.ImageField(upload_to="restaurants/photos/", null=True, blank=True)
    photo6 = models.ImageField(upload_to="restaurants/photos/", null=True, blank=True)

    # ✅ Лого — тоже файл, чтобы работал logo.url и upload
    logo = models.ImageField(upload_to="restaurants/logos/", null=True, blank=True)

    front_template = models.CharField(
        max_length=255,
        blank=True,
        verbose_name="Шаблон фронтенда",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return self.name

    class Meta:
        verbose_name = "Ресторан"
        verbose_name_plural = "Рестораны"


class User(AbstractUser):
    """
    Пользователь системы.
    """

    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name="users",
        null=True,
        blank=True,
        verbose_name="Ресторан",
    )

    def __str__(self) -> str:
        return f"{self.username} ({self.restaurant})"

    class Meta:
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"


class Category(models.Model):
    # старое поле пока оставляем (для совместимости)
    name = models.CharField(max_length=255, verbose_name="Название категории")

    # ✅ NEW: bilingual fields (TR + EN + RU)
    name_tr = models.CharField(max_length=255, blank=True, default="", verbose_name="Название (TR)")
    name_en = models.CharField(max_length=255, blank=True, default="", verbose_name="Название (EN)")
    name_ru = models.CharField(max_length=255, blank=True, default="", verbose_name="Название (RU)")
    name_i18n = models.JSONField(default=dict, verbose_name="Название (i18n JSON)")

    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name="categories",
        verbose_name="Ресторан",
    )
    sort_order = models.PositiveIntegerField(default=0, db_index=True)

    # ✅ NEW: system flag (Unsorted etc.)
    is_system = models.BooleanField(default=False, verbose_name="Системная категория")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return self.name_tr or self.name or self.name_en or f"Category #{self.pk}"

    class Meta:
        verbose_name = "Категория"
        verbose_name_plural = "Категории"


class Dish(models.Model):
    # старые поля пока оставляем (для совместимости)
    name = models.CharField(max_length=255, verbose_name="Название блюда")
    description = models.TextField(blank=True, verbose_name="Описание")
    is_active = models.BooleanField(default=True, db_index=True, verbose_name="Активно (видно туристам)")

    # ✅ Bilingual fields (TR + EN + RU)
    name_tr = models.CharField(max_length=255, blank=True, default="", verbose_name="Название (TR)")
    name_en = models.CharField(max_length=255, blank=True, default="", verbose_name="Название (EN)")
    description_tr = models.TextField(blank=True, default="", verbose_name="Описание (TR)")
    description_en = models.TextField(blank=True, default="", verbose_name="Описание (EN)")
    name_ru = models.CharField(max_length=255, blank=True, default="", verbose_name="Название (RU)")
    description_ru = models.TextField(blank=True, default="", verbose_name="Описание (RU)")
    name_i18n = models.JSONField(default=dict, verbose_name="Название (i18n JSON)")
    description_i18n = models.JSONField(default=dict, verbose_name="Описание (i18n JSON)")

    
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Цена")
    image = models.ImageField(upload_to="dishes/images/", blank=True, null=True)

    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="dishes",
        verbose_name="Категория",
    )
    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name="dishes",
        verbose_name="Ресторан",
    )

    # ✅ NEW: Аллергены и диетические метки (Phase 1.3)
    is_vegetarian = models.BooleanField(default=False, verbose_name="🥗 Вегетарианское")
    is_vegan = models.BooleanField(default=False, verbose_name="🌱 Веганское")
    is_gluten_free = models.BooleanField(default=False, verbose_name="🌾 Без глютена")
    is_spicy = models.BooleanField(default=False, verbose_name="🌶️ Острое")

    # ✅ Lifecycle fields
    moved_to_unsorted_at = models.DateTimeField(null=True, blank=True, verbose_name="Перемещено в Unsorted")
    archived_at = models.DateTimeField(null=True, blank=True, verbose_name="В архиве с")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return self.name_tr or self.name or self.name_en or f"Dish #{self.pk}"

    class Meta:
        verbose_name = "Блюдо"
        verbose_name_plural = "Блюда"


class Subscription(models.Model):
    """
    Подписка ресторана.
    """

    STATUS_CHOICES = (
        ("inactive", "Неактивна"),
        ("trial", "Триал"),
        ("active", "Активна"),
        ("past_due", "Просрочена"),
        ("canceled", "Отменена"),
    )

    restaurant = models.OneToOneField(
        Restaurant,
        on_delete=models.CASCADE,
        related_name="subscription",
        verbose_name="Ресторан",
    )

    tariff = models.CharField(max_length=64, blank=True, default="", verbose_name="Тариф")

    status = models.CharField(
        max_length=32,
        choices=STATUS_CHOICES,
        default="inactive",
        verbose_name="Статус",
    )

    started_at = models.DateTimeField(auto_now_add=True, verbose_name="Начало подписки")
    expires_at = models.DateTimeField(null=True, blank=True, verbose_name="Истекает")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def is_active(self):
        now = timezone.now()

        if self.status == "active":
            if self.expires_at and self.expires_at < now:
                return False
            return True

        if self.status == "trial":
            if self.expires_at and self.expires_at > now:
                return True

        return False

    def __str__(self) -> str:
        return f"{self.restaurant} ({self.status})"

    class Meta:
        verbose_name = "Подписка"
        verbose_name_plural = "Подписки"


class PaymentHistory(models.Model):
    STATUS_CHOICES = (
        ("pending", "В ожидании"),
        ("success", "Успешно"),
        ("failed", "Ошибка"),
        ("refunded", "Возврат"),
    )

    PAYMENT_METHOD_CHOICES = (
        ("card", "Банковская карта"),
        ("bank_transfer", "Банковский перевод"),
        ("cash", "Наличные"),
        ("other", "Другой способ"),
    )

    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name="payments",
        verbose_name="Ресторан",
    )

    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Сумма")

    paid_at = models.DateTimeField(verbose_name="Дата платежа")

    payment_method = models.CharField(
        max_length=32,
        choices=PAYMENT_METHOD_CHOICES,
        verbose_name="Способ оплаты",
    )

    status = models.CharField(
        max_length=32,
        choices=STATUS_CHOICES,
        default="pending",
        verbose_name="Статус",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"{self.amount} {self.restaurant} ({self.status})"

    class Meta:
        verbose_name = "Платёж"
        verbose_name_plural = "История платежей"