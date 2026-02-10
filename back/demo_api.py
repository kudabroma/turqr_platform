#!/usr/bin/env python
"""
Демо-скрипт для тестирования API QR Menu SaaS проекта.
Показывает основные функции API.
"""

import os
import sys
import json
import requests
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

# Устанавливаем переменную окружения для Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_test')

import django
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from restaurants.models import Restaurant, Category, Dish, Subscription, PaymentHistory

User = get_user_model()

def demo_api():
    """Демонстрация работы API"""
    print("🍽️  QR Menu SaaS - Демо API")
    print("=" * 50)

    # Создаем тестовые данные
    print("📝 Создание тестовых данных...")

    restaurant = Restaurant.objects.create(
        name="Демо Ресторан",
        contacts="demo@example.com",
        logo="demo.png",
        front_template="modern"
    )

    user = User.objects.create_user(
        username="demo",
        password="demo123",
        restaurant=restaurant
    )

    category = Category.objects.create(
        name="Основное меню",
        restaurant=restaurant
    )

    dish = Dish.objects.create(
        name="Паста Карбонара",
        description="Итальянская паста с беконом и яйцом",
        price=350.00,
        category=category,
        restaurant=restaurant
    )

    subscription = Subscription.objects.create(
        restaurant=restaurant,
        tariff="Business",
        status="active"
    )

    payment = PaymentHistory.objects.create(
        restaurant=restaurant,
        amount=2500.00,
        payment_method="card",
        status="completed"
    )

    print("✅ Тестовые данные созданы")
    print()

    # Тестируем API через Django test client
    client = Client()

    # 1. Регистрация
    print("1️⃣  Регистрация нового пользователя:")
    register_data = {
        "username": "newdemo",
        "password": "newpass123",
        "restaurant_name": "Новый Демо Ресторан"
    }

    # Имитируем POST запрос
    from django.urls import reverse
    response = client.post(
        reverse('register'),
        data=json.dumps(register_data),
        content_type='application/json'
    )

    print(f"   Статус: {response.status_code}")
    if response.status_code == 201:
        print("   ✅ Регистрация успешна")
        user_data = response.json()
        print(f"   Пользователь: {user_data['username']}")
        print(f"   Ресторан: {user_data['restaurant']['name']}")
    else:
        print(f"   ❌ Ошибка: {response.content.decode()}")

    print()

    # 2. Логин
    print("2️⃣  Авторизация (логин):")
    login_data = {
        "username": "demo",
        "password": "demo123"
    }

    response = client.post(
        reverse('login'),
        data=json.dumps(login_data),
        content_type='application/json'
    )

    print(f"   Статус: {response.status_code}")
    if response.status_code == 200:
        print("   ✅ Авторизация успешна")
        login_response = response.json()
        print(f"   Пользователь: {login_response['username']}")
    else:
        print(f"   ❌ Ошибка: {response.content.decode()}")

    print()

    # 3. Получение меню
    print("3️⃣  Получение меню ресторана:")

    # Авторизуемся
    client.login(username='demo', password='demo123')

    response = client.get(reverse('menu'))

    print(f"   Статус: {response.status_code}")
    if response.status_code == 200:
        print("   ✅ Меню получено")
        menu_data = response.json()
        print(f"   Категорий: {len(menu_data)}")
        for cat in menu_data:
            print(f"   📁 {cat['name']}")
            for dish in cat['dishes']:
                print(f"      🍽️  {dish['name']} - {dish['price']} руб.")
    else:
        print(f"   ❌ Ошибка: {response.content.decode()}")

    print()

    # 4. Создание категории
    print("4️⃣  Создание новой категории:")

    category_data = {"name": "Десерты"}
    response = client.post(
        reverse('category-list'),
        data=json.dumps(category_data),
        content_type='application/json'
    )

    print(f"   Статус: {response.status_code}")
    if response.status_code == 201:
        print("   ✅ Категория создана")
        cat_response = response.json()
        print(f"   Название: {cat_response['name']}")
    else:
        print(f"   ❌ Ошибка: {response.content.decode()}")

    print()

    # 5. Создание блюда
    print("5️⃣  Создание нового блюда:")

    dish_data = {
        "name": "Тирамису",
        "description": "Классический итальянский десерт",
        "price": "200.00",
        "category": cat_response['id']
    }
    response = client.post(
        reverse('dish-list'),
        data=json.dumps(dish_data),
        content_type='application/json'
    )

    print(f"   Статус: {response.status_code}")
    if response.status_code == 201:
        print("   ✅ Блюдо создано")
        dish_response = response.json()
        print(f"   Название: {dish_response['name']}")
        print(f"   Цена: {dish_response['price']} руб.")
    else:
        print(f"   ❌ Ошибка: {response.content.decode()}")

    print()

    # 6. Получение подписки
    print("6️⃣  Получение информации о подписке:")

    response = client.get(reverse('subscription'))

    print(f"   Статус: {response.status_code}")
    if response.status_code == 200:
        print("   ✅ Подписка получена")
        sub_data = response.json()
        print(f"   Тариф: {sub_data['tariff']}")
        print(f"   Статус: {sub_data['status']}")
    else:
        print(f"   ❌ Ошибка: {response.content.decode()}")

    print()

    # 7. Получение истории платежей
    print("7️⃣  Получение истории платежей:")

    response = client.get(reverse('payment-history-list'))

    print(f"   Статус: {response.status_code}")
    if response.status_code == 200:
        print("   ✅ История платежей получена")
        payments_data = response.json()
        print(f"   Платежей: {len(payments_data)}")
        for payment in payments_data:
            print(f"   💳 {payment['amount']} руб. - {payment['status']} ({payment['payment_method']})")
    else:
        print(f"   ❌ Ошибка: {response.content.decode()}")

    print()
    print("🎉 Демо завершено!")
    print("💡 Теперь можете запустить полноценные тесты командой: python test_project.py")

if __name__ == "__main__":
    demo_api()