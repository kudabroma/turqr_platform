from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models


class Restaurant(models.Model):
    """
    Ресторан, для которого создаётся QR-меню.
    """

    PLAN_CHOICES = (
        ("basic", "Базовый"),
        ("menu", "Меню"),
        ("full", "Полный"),
    )

    name = models.CharField(max_length=255, verbose_name="Название ресторана")
    slug = models.SlugField(
        max_length=255,
        unique=True,
        help_text="Используется в URL и поддомене ресторана"
    )
    contacts = models.TextField(
        blank=True,
        verbose_name="Контакты (телефон, email, адрес и т.д.)",
    )
    phone = models.CharField(max_length=50, blank=True, default="", verbose_name="Телефон")
    email = models.EmailField(blank=True, default="", verbose_name="Email")
    address = models.TextField(blank=True, default="", verbose_name="Адрес")

    logo = models.CharField(
        max_length=500,
        blank=True,
        default="",
        verbose_name="Логотип (URL или путь)",
    )
    front_template = models.CharField(
        max_length=255,
        blank=True,
        verbose_name="Шаблон фронтенда (тема для QR-меню)",
    )

    # Subscription fields moved directly to Restaurant
    active = models.BooleanField(default=True, verbose_name="Активен")
    plan = models.CharField(
        max_length=32,
        choices=PLAN_CHOICES,
        default="basic",
        verbose_name="Тарифный план"
    )
    paid_until = models.DateField(
        null=True,
        blank=True,
        verbose_name="Оплачено до"
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
    Классический пользователь с логином и паролем.

    Используем стандартную модель AbstractUser, где:
    - username = логин
    - password хранится в хэшированном виде (Django сам хэширует пароль)
    """

    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name="users",
        verbose_name="Ресторан",
        null=True,
        blank=True,
    )

    def __str__(self) -> str:
        return f"{self.username} ({self.restaurant})"

    class Meta:
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"


class Category(models.Model):
    """
    Категория меню (Напитки, Десерты и т.п.).
    """

    name = models.CharField(max_length=255, verbose_name="Название категории")
    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name="categories",
        verbose_name="Ресторан",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"{self.name} ({self.restaurant})"

    class Meta:
        verbose_name = "Категория меню"
        verbose_name_plural = "Категории меню"
        unique_together = ("name", "restaurant")


class Dish(models.Model):
    """
    Блюдо в меню ресторана.
    """

    name = models.CharField(max_length=255, verbose_name="Название блюда")
    description = models.TextField(blank=True, verbose_name="Описание")
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Цена",
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="dishes",
        verbose_name="Категория",
    )
    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name="dishes",
        verbose_name="Ресторан",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"{self.name} ({self.restaurant})"

    class Meta:
        verbose_name = "Блюдо"
        verbose_name_plural = "Блюда"


class Subscription(models.Model):
    """
    Подписка ресторана на SaaS-сервис.

    Requirements:
    - One-to-one with Restaurant
    - status: active / inactive / trial
    - started_at (datetime)
    - expires_at (datetime, nullable)
    """

    STATUS_CHOICES = (
        ("active", "Активна"),
        ("inactive", "Неактивна"),
        ("trial", "Триал"),
    )

    restaurant = models.OneToOneField(
        Restaurant,
        on_delete=models.CASCADE,
        related_name="subscription",
        verbose_name="Ресторан",
    )
    # Keep tariff free-form (no strict choices) to remain backwards-compatible with existing fixtures/tests
    tariff = models.CharField(max_length=64, blank=True, default="", verbose_name="Тариф")
    status = models.CharField(
        max_length=32,
        choices=STATUS_CHOICES,
        default="inactive",
        verbose_name="Статус",
    )
    started_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата и время начала")
    expires_at = models.DateTimeField(null=True, blank=True, verbose_name="Дата и время истечения")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"Подписка {self.restaurant} ({self.tariff}, {self.status})"

    class Meta:
        verbose_name = "Подписка"
        verbose_name_plural = "Подписки"


class PaymentHistory(models.Model):
    """
    История платежей ресторана.
    """

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
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Сумма",
    )
    paid_at = models.DateTimeField(
        verbose_name="Дата и время платежа",
    )
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
