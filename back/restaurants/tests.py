import json
from datetime import date, datetime
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from .models import Restaurant, Category, Dish, Subscription, PaymentHistory

User = get_user_model()


class RestaurantAPITestCase(APITestCase):
    """Базовый класс для тестирования API ресторана с аутентификацией"""

    def setUp(self):
        """Создание тестовых данных и аутентификация"""
        # Создаем ресторан
        self.restaurant = Restaurant.objects.create(
            name="Test Restaurant",
            contacts="test@example.com",
            logo="logo.png",
            front_template="default"
        )

        # Создаем пользователя
        self.user = User.objects.create_user(
            username="testuser",
            password="testpass123",
            restaurant=self.restaurant
        )

        # Создаем клиента и аутентифицируем
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # Создаем тестовые категории и блюда
        self.category1 = Category.objects.create(
            name="Основные блюда",
            restaurant=self.restaurant
        )
        self.category2 = Category.objects.create(
            name="Напитки",
            restaurant=self.restaurant
        )

        self.dish1 = Dish.objects.create(
            name="Борщ",
            description="Красный борщ с мясом",
            price=150.00,
            category=self.category1,
            restaurant=self.restaurant
        )
        self.dish2 = Dish.objects.create(
            name="Чай",
            description="Черный чай",
            price=50.00,
            category=self.category2,
            restaurant=self.restaurant
        )

        # Создаем подписку
        from django.utils import timezone
        self.subscription = Subscription.objects.create(
            restaurant=self.restaurant,
            tariff="Premium",
            status="active",
            expires_at=timezone.now().replace(year=timezone.now().year + 1),
        )

        # Создаем платеж
        self.payment = PaymentHistory.objects.create(
            restaurant=self.restaurant,
            amount=1000.00,
            paid_at=datetime.now(),
            payment_method="card",
            status="completed"
        )


class AuthenticationTests(TestCase):
    """Тесты авторизации"""

    def setUp(self):
        self.client = Client()

    def test_user_registration(self):
        """Тест регистрации нового пользователя"""
        data = {
            "username": "newuser",
            "password": "newpass123",
            "restaurant_name": "New Restaurant"
        }

        response = self.client.post(
            reverse('auth-register'),
            data=json.dumps(data),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.json())
        self.assertIn('username', response.json())
        self.assertIn('restaurant', response.json())

        # Проверяем, что пользователь создан
        user = User.objects.get(username='newuser')
        self.assertTrue(user.check_password('newpass123'))
        self.assertEqual(user.restaurant.name, 'New Restaurant')

    def test_user_registration_duplicate_username(self):
        """Тест регистрации с существующим username"""
        # Создаем первого пользователя
        restaurant = Restaurant.objects.create(name="First Restaurant")
        User.objects.create_user(username="existinguser", password="pass123", restaurant=restaurant)

        data = {
            "username": "existinguser",
            "password": "newpass123",
            "restaurant_name": "New Restaurant"
        }

        response = self.client.post(
            reverse('auth-register'),
            data=json.dumps(data),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_login(self):
        """Тест логина пользователя"""
        # Создаем пользователя
        restaurant = Restaurant.objects.create(name="Login Test Restaurant")
        user = User.objects.create_user(username="logintest", password="loginpass123", restaurant=restaurant)

        data = {
            "username": "logintest",
            "password": "loginpass123"
        }

        response = self.client.post(
            reverse('auth-login'),
            data=json.dumps(data),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('id', response.json())
        self.assertEqual(response.json()['username'], 'logintest')

    def test_user_login_wrong_password(self):
        """Тест логина с неправильным паролем"""
        restaurant = Restaurant.objects.create(name="Wrong Pass Restaurant")
        User.objects.create_user(username="wrongpass", password="rightpass", restaurant=restaurant)

        data = {
            "username": "wrongpass",
            "password": "wrongpass"
        }

        response = self.client.post(
            reverse('auth-login'),
            data=json.dumps(data),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class MenuAPITests(RestaurantAPITestCase):
    """Тесты API меню"""

    def test_get_menu(self):
        """Тест получения меню ресторана"""
        response = self.client.get(reverse('menu'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.json()
        self.assertEqual(len(data), 2)  # Две категории

        # Проверяем первую категорию
        category1_data = data[0]
        self.assertEqual(category1_data['name'], 'Основные блюда')
        self.assertEqual(len(category1_data['dishes']), 1)
        self.assertEqual(category1_data['dishes'][0]['name'], 'Борщ')
        self.assertEqual(category1_data['dishes'][0]['price'], '150.00')

    def test_get_menu_unauthenticated(self):
        """Тест получения меню без авторизации"""
        self.client.logout()
        response = self.client.get(reverse('menu'))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class CategoryAPITests(RestaurantAPITestCase):
    """Тесты CRUD операций с категориями"""

    def test_get_categories(self):
        """Тест получения списка категорий"""
        response = self.client.get(reverse('category-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 2)

    def test_create_category(self):
        """Тест создания новой категории"""
        data = {"name": "Десерты"}
        response = self.client.post(reverse('category-list'), data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()['name'], 'Десерты')

        # Проверяем, что категория привязана к ресторану пользователя
        category = Category.objects.get(name='Десерты')
        self.assertEqual(category.restaurant, self.restaurant)

    def test_create_category_duplicate_name(self):
        """Тест создания категории с существующим именем в ресторане"""
        data = {"name": "Основные блюда"}  # Уже существует
        with self.assertRaises(Exception):  # Ожидаем IntegrityError
            self.client.post(reverse('category-list'), data)

    def test_update_category(self):
        """Тест обновления категории"""
        data = {"name": "Основные блюда обновлено"}
        response = self.client.put(
            reverse('category-detail', kwargs={'pk': self.category1.pk}),
            data=json.dumps(data),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['name'], 'Основные блюда обновлено')

    def test_delete_category(self):
        """Тест удаления категории"""
        response = self.client.delete(
            reverse('category-detail', kwargs={'pk': self.category1.pk})
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Category.objects.filter(pk=self.category1.pk).exists())


class DishAPITests(RestaurantAPITestCase):
    """Тесты CRUD операций с блюдами"""

    def test_get_dishes(self):
        """Тест получения списка блюд"""
        response = self.client.get(reverse('dish-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 2)

    def test_create_dish(self):
        """Тест создания нового блюда"""
        data = {
            "name": "Салат Цезарь",
            "description": "Салат с курицей и пармезаном",
            "price": "200.00",
            "category": self.category1.pk
        }
        response = self.client.post(reverse('dish-list'), data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()['name'], 'Салат Цезарь')
        self.assertEqual(response.json()['price'], '200.00')

        # Проверяем, что блюдо привязано к ресторану пользователя
        dish = Dish.objects.get(name='Салат Цезарь')
        self.assertEqual(dish.restaurant, self.restaurant)

    def test_update_dish(self):
        """Тест обновления блюда"""
        data = {
            "name": "Борщ обновленный",
            "description": "Красный борщ с мясом и сметаной",
            "price": "180.00",
            "category": self.category1.pk
        }
        response = self.client.put(
            reverse('dish-detail', kwargs={'pk': self.dish1.pk}),
            data=json.dumps(data),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['name'], 'Борщ обновленный')
        self.assertEqual(response.json()['price'], '180.00')

    def test_delete_dish(self):
        """Тест удаления блюда"""
        response = self.client.delete(
            reverse('dish-detail', kwargs={'pk': self.dish1.pk})
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Dish.objects.filter(pk=self.dish1.pk).exists())


class SubscriptionAPITests(RestaurantAPITestCase):
    """Тесты API подписки"""

    def test_get_subscription(self):
        """Тест получения информации о подписке"""
        response = self.client.get(reverse('subscription'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['tariff'], 'Premium')
        self.assertEqual(response.json()['status'], 'active')

    def test_get_subscription_no_subscription(self):
        """Тест получения подписки, когда ее нет"""
        # Удаляем подписку
        self.subscription.delete()

        response = self.client.get(reverse('subscription'))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('error', response.json())


class PaymentHistoryAPITests(RestaurantAPITestCase):
    """Тесты API истории платежей"""

    def test_get_payment_history(self):
        """Тест получения истории платежей"""
        response = self.client.get(reverse('payment-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]['amount'], '1000.00')
        self.assertEqual(response.json()[0]['payment_method'], 'card')
        self.assertEqual(response.json()[0]['status'], 'completed')


class DataIsolationTests(TestCase):
    """Тесты изоляции данных между ресторанами"""

    def setUp(self):
        self.client = APIClient()

        # Создаем два ресторана с пользователями
        self.restaurant1 = Restaurant.objects.create(name="Restaurant 1")
        self.restaurant2 = Restaurant.objects.create(name="Restaurant 2")

        self.user1 = User.objects.create_user(username="user1", password="pass1", restaurant=self.restaurant1)
        self.user2 = User.objects.create_user(username="user2", password="pass2", restaurant=self.restaurant2)

        # Категории для каждого ресторана
        self.category1 = Category.objects.create(name="Категория 1", restaurant=self.restaurant1)
        self.category2 = Category.objects.create(name="Категория 1", restaurant=self.restaurant2)  # То же имя, но другой ресторан
        # Подписки для каждого ресторана (активные), чтобы прохождить проверку подписки
        from django.utils import timezone
        Subscription.objects.create(restaurant=self.restaurant1, tariff="Basic", status="active", expires_at=timezone.now().replace(year=timezone.now().year + 1))
        Subscription.objects.create(restaurant=self.restaurant2, tariff="Basic", status="active", expires_at=timezone.now().replace(year=timezone.now().year + 1))

    def test_user_cannot_access_other_restaurant_data(self):
        """Тест, что пользователь не может видеть данные другого ресторана"""
        # Авторизуемся как user1
        self.client.force_authenticate(user=self.user1)

        # Получаем категории - должны видеть только категории restaurant1
        response = self.client.get(reverse('category-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]['name'], 'Категория 1')


class SubscriptionRestrictionTests(APITestCase):
    """Tests for subscription-based access control"""

    def setUp(self):
        from django.utils import timezone
        # restaurant with active subscription
        self.rest_active = Restaurant.objects.create(name="Active Restaurant")
        self.user_active = User.objects.create_user(username="u_active", password="p", restaurant=self.rest_active)
        Subscription.objects.create(restaurant=self.rest_active, tariff="X", status="active", expires_at=timezone.now().replace(year=timezone.now().year + 1))
        Category.objects.create(name="C1", restaurant=self.rest_active)

        # restaurant with trial subscription
        self.rest_trial = Restaurant.objects.create(name="Trial Restaurant")
        self.user_trial = User.objects.create_user(username="u_trial", password="p", restaurant=self.rest_trial)
        Subscription.objects.create(restaurant=self.rest_trial, tariff="X", status="trial", expires_at=timezone.now().replace(year=timezone.now().year + 1))
        Category.objects.create(name="C2", restaurant=self.rest_trial)

        # restaurant with inactive subscription
        self.rest_inactive = Restaurant.objects.create(name="Inactive Restaurant")
        self.user_inactive = User.objects.create_user(username="u_inactive", password="p", restaurant=self.rest_inactive)
        Subscription.objects.create(restaurant=self.rest_inactive, tariff="X", status="inactive")
        Category.objects.create(name="C3", restaurant=self.rest_inactive)

        # superuser
        self.superuser = User.objects.create_superuser(username="admin", password="adminpass", email="admin@example.com")

        self.client = APIClient()

    def test_inactive_subscription_denied(self):
        self.client.force_authenticate(user=self.user_inactive)
        response = self.client.get(reverse('menu'))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_active_subscription_allowed(self):
        self.client.force_authenticate(user=self.user_active)
        response = self.client.get(reverse('menu'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_trial_subscription_allowed(self):
        self.client.force_authenticate(user=self.user_trial)
        response = self.client.get(reverse('menu'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_superuser_bypasses_subscription(self):
        self.client.force_authenticate(user=self.superuser)
        # superuser can request any restaurant menu via ?restaurant_id=
        response = self.client.get(f"{reverse('menu')}?restaurant_id={self.rest_inactive.pk}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Авторизуемся как user2
        self.client.force_authenticate(user=self.user2)

        # Получаем категории - должны видеть только категории restaurant2
        response = self.client.get(reverse('category-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]['name'], 'Категория 1')
