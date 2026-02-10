# QR Menu SaaS Backend (Django + DRF)
        source venv/bin/activate
Бэкенд первого шага SaaS‑платформы QR‑меню для ресторанов.

## Технологии

- Django 6
- Django REST Framework
- PostgreSQL
- Классическая авторизация по логину и паролю (SessionAuthentication)

## Установка и запуск (локально)

```bash
cd C:\back
python -m venv venv
.\venv\bin\python -m pip install -r requirements.txt
```

Создайте файл `.env` в корне проекта по образцу:

```env
DJANGO_SECRET_KEY=django-insecure-change-me
DJANGO_ALLOWED_HOSTS=localhost 127.0.0.1

DB_NAME=qrmenu
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
```

Создайте базу данных PostgreSQL `qrmenu` (или другую, если меняете `DB_NAME`).

Далее примените миграции и запустите сервер:

```bash
.\venv\bin\python manage.py migrate
.\venv\bin\python manage.py createsuperuser
.\venv\bin\python manage.py runserver
```

## Основные модели

    - `Restaurant`: имя, контакты, логотип (URL или путь), шаблон фронта.
- `User` (кастомный): логин (`username`), пароль (хэшированный), связь с рестораном.
- `Category`: категории меню (название, ресторан).
- `Dish`: блюда (название, описание, цена, категория, ресторан).
- `Subscription`: тариф, статус, дата начала, дата окончания, ресторан.
- `PaymentHistory`: история платежей (сумма, дата, способ оплаты, ресторан, статус).

## Аутентификация

- Регистрация: `POST /api/auth/register/`
  - тело: `{"username": "...", "password": "...", "restaurant_name": "..."}`
  - создаёт ресторан и первого пользователя, пароль хэшируется Django.
- Логин: `POST /api/auth/login/`
  - тело: `{"username": "...", "password": "..."}`
  - создаёт сессию, дальнейший доступ к API через cookie.
- Логаут: `POST /api/auth/logout/`

Все остальные API защищены и доступны только для залогиненных пользователей.
Каждый пользователь работает только со своим рестораном (фильтрация `queryset` по `request.user.restaurant`).

## Основные API‑эндпоинты

- `GET /api/menu/` — все категории и блюда ресторана текущего пользователя.
- `GET /api/subscription/` — информация о подписке ресторана.
- `GET/POST/PUT/PATCH/DELETE /api/categories/` — CRUD категорий.
- `GET/POST/PUT/PATCH/DELETE /api/dishes/` — CRUD блюд.
- `GET /api/payments/` — история платежей (read‑only).

## 🧪 Тестирование

Проект включает комплексные тесты для проверки всех функций API.

### Запуск всех тестов

```bash
# Активируйте виртуальное окружение
.\venv\bin\python.exe test_project.py
```

**Если при установке Pillow возникают проблемы (ошибка сборки, отсутствие zlib/jpeg):**

1.  Попробуйте обновить pip: `.\venv\bin\python.exe -m pip install --upgrade pip`
2.  Установите последнюю версию Pillow, которая может включать бинарные wheel-файлы:
    `.\venv\bin\python.exe -m pip install Pillow`
3.  Если это не помогает и вы на Windows, возможно, потребуется установить необходимые библиотеки (например, zlib, libjpeg) вручную или через менеджеры пакетов вроде MSYS2/MinGW. Однако, в данном проекте поле `logo` изменено на `CharField`, поэтому Pillow не является критичной зависимостью для запуска проекта, если вы не планируете использовать функциональность обработки изображений.

### Запуск отдельных тестов

```bash
# Запуск тестов конкретного модуля
.\venv\bin\python.exe -m pytest restaurants/tests.py -v

# Или через Django
.\venv\bin\python.exe manage.py test restaurants --settings=config.settings_test
```

### Что тестируется

- ✅ **Регистрация пользователей** — создание ресторана и пользователя
- ✅ **Авторизация** — логин/логаут с сессиями
- ✅ **CRUD категории** — создание, чтение, обновление, удаление
- ✅ **CRUD блюда** — создание, чтение, обновление, удаление
- ✅ **Получение меню** — иерархическое отображение категорий и блюд
- ✅ **Информация о подписке** — получение данных подписки
- ✅ **История платежей** — получение списка платежей
- ✅ **Изоляция данных** — пользователи видят только данные своего ресторана

### Демо-скрипт

Запустите демо для быстрого ознакомления с API:

```bash
.\venv\bin\python.exe demo_api.py
```

Демо создаст тестовые данные и продемонстрирует работу основных эндпоинтов.

### Тестовые данные

В папке `restaurants/fixtures/` находятся JSON-файлы с тестовыми данными:

- `test_data.json` — базовые тестовые данные для разработки

### Ручное тестирование через браузер

1. Запустите сервер: `.\venv\bin\python.exe manage.py runserver --settings=config.settings_test`
2. Откройте `http://127.0.0.1:8000/api/` — DRF Browsable API
3. Создайте пользователя через регистрацию
4. Авторизуйтесь и тестируйте эндпоинты
